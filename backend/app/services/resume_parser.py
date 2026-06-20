"""Resume Parser Service — extracts skills and experience from resume files/text."""

import re
import io
import json
import asyncio
from typing import Any

# Import pypdf and docx safely (should be installed)
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None

from app.core.config import settings

# Common tech skills dictionary for matching (fallback)
KNOWN_SKILLS = [
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "React", "Angular", "Vue", "Next.js", "Node.js", "Express", "Django", "Flask", "FastAPI", "Spring Boot",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Jenkins", "CI/CD",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLAlchemy",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch",
    "Git", "Linux", "Agile", "Scrum", "REST API", "GraphQL", "Microservices",
    "HTML", "CSS", "SASS", "Tailwind", "Bootstrap",
    "Figma", "Adobe XD", "UI/UX",
    "Power BI", "Tableau", "Data Analysis", "SQL", "Pandas", "NumPy",
    "Security", "OAuth", "JWT", "Cryptography",
    "Project Management", "Leadership", "Communication", "Problem Solving",
]


def extract_skills_from_text(text: str) -> list[dict]:
    """Extract recognized skills from resume text using pattern matching (fallback)."""
    found_skills = []
    text_lower = text.lower()

    for skill in KNOWN_SKILLS:
        # Use word boundary matching
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append({
                "name": skill,
                "source": "resume",
                "confidence": 0.5,  # Resume-based starts at 50% confidence
            })

    return found_skills


def extract_experience_years(text: str) -> float | None:
    """Extract years of experience from resume text (fallback)."""
    patterns = [
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)',
        r'experience\s*:?\s*(\d+)\+?\s*(?:years?|yrs?)',
        r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:in\s+(?:the\s+)?(?:industry|field|software|tech))',
    ]

    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return float(match.group(1))

    return None


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF file bytes."""
    text = ""
    if not pypdf:
        return text
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t + "\n"
    except Exception as e:
        import logging
        logging.error(f"Error extracting text from PDF: {e}")
    return text


def extract_text_from_docx(docx_bytes: bytes) -> str:
    """Extract text from DOCX file bytes."""
    text = ""
    if not docx:
        return text
    try:
        doc = docx.Document(io.BytesIO(docx_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        import logging
        logging.error(f"Error extracting text from DOCX: {e}")
    return text


def parse_resume_regex(text: str) -> dict[str, Any]:
    """Parse resume text using regex patterns (deterministic fallback)."""
    skills = extract_skills_from_text(text)
    experience = extract_experience_years(text)

    return {
        "extracted_skills": skills,
        "skill_count": len(skills),
        "experience_years": experience,
        "skill_names": [s["name"] for s in skills],
        "parsed_by": "fallback_regex"
    }


def _parse_json_response(raw_response: str) -> dict[str, Any] | None:
    """Clean markdown backticks and parse JSON safely."""
    clean = raw_response.strip()
    if clean.startswith("```"):
        clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
    if clean.endswith("```"):
        clean = clean[:-3]
    clean = clean.strip()
    
    try:
        parsed = json.loads(clean)
        # Ensure schema matches
        if not isinstance(parsed, dict):
            return None
        experience = parsed.get("experience_years")
        if experience is not None:
            try:
                experience = float(experience)
            except (ValueError, TypeError):
                experience = None
                
        skills = []
        for s in parsed.get("extracted_skills", []):
            if isinstance(s, dict) and "name" in s:
                name = str(s["name"]).strip()
                if name:
                    confidence = s.get("confidence")
                    try:
                        confidence = float(confidence) if confidence is not None else 0.5
                    except (ValueError, TypeError):
                        confidence = 0.5
                    skills.append({
                        "name": name,
                        "source": "resume",
                        "confidence": confidence
                    })
        return {
            "experience_years": experience,
            "extracted_skills": skills,
            "skill_count": len(skills),
            "skill_names": [s["name"] for s in skills],
        }
    except Exception:
        return None


async def parse_resume_ai(
    text: str,
    provider: str = "gemini",
    model: str | None = None,
    api_key: str | None = None,
) -> dict[str, Any] | None:
    """Call the specified AI provider to extract skills and experience."""
    prompt = f"""You are an expert recruiter and skill extraction AI.
Analyze the following resume text and extract:
1. The total years of professional experience (as a float, e.g. 5.5, or null if not clear).
2. A list of technical and professional skills mentioned in the resume. For each skill, assign a confidence score between 0.0 and 1.0 based on how clearly it is demonstrated or mentioned.

Resume Text:
{text}

Return ONLY a valid JSON object in this exact shape, without any markdown formatting, extra explanation, or conversational text:
{{
  "experience_years": float_or_null,
  "extracted_skills": [
    {{
      "name": "Skill Name",
      "confidence": float
    }}
  ]
}}
"""

    if provider == "ollama":
        try:
            from app.ai.gemini_client import call_ollama, get_ollama_model
            selected_model = model or await get_ollama_model()
            raw_response = await call_ollama(prompt, selected_model)
            return _parse_json_response(raw_response)
        except Exception as exc:
            import logging
            logging.error(f"Ollama resume parsing failed: {exc}")
            return None
            
    else:  # gemini
        active_key = api_key or settings.GEMINI_API_KEY
        if not active_key:
            return None
            
        try:
            import google.generativeai as genai
            genai.configure(api_key=active_key)
            selected_model = model or "gemini-2.0-flash"
            gemini_model = genai.GenerativeModel(selected_model)
            
            response = await asyncio.to_thread(gemini_model.generate_content, prompt)
            raw_response = response.text.strip()
            return _parse_json_response(raw_response)
        except Exception as exc:
            import logging
            logging.error(f"Gemini resume parsing failed: {exc}")
            return None


async def parse_resume(
    content: bytes | str,
    filename: str | None = None,
    provider: str = "gemini",
    model: str | None = None,
    api_key: str | None = None,
) -> dict[str, Any]:
    """Parse resume content (bytes or text) and return extracted information."""
    text = ""
    if isinstance(content, str):
        text = content
    else:
        # Extract text from bytes based on filename suffix
        ext = (filename or "").lower().split(".")[-1]
        if ext == "pdf":
            text = extract_text_from_pdf(content)
        elif ext in ["docx", "doc"]:
            text = extract_text_from_docx(content)
        else:
            try:
                text = content.decode("utf-8", errors="ignore")
            except Exception:
                text = ""

    if not text.strip():
        return {
            "extracted_skills": [],
            "skill_count": 0,
            "experience_years": None,
            "skill_names": [],
            "parsed_by": "empty",
            "extracted_text": ""
        }

    # Attempt AI parsing
    ai_result = await parse_resume_ai(text, provider=provider, model=model, api_key=api_key)
    if ai_result:
        ai_result["parsed_by"] = f"ai_{provider}"
        ai_result["extracted_text"] = text
        return ai_result

    # Fallback to regex
    reg_result = parse_resume_regex(text)
    reg_result["extracted_text"] = text
    return reg_result
