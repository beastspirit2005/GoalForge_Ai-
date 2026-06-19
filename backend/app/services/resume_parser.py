"""Resume Parser Service — extracts skills and experience from resume text."""

import re
from typing import Any


# Common tech skills dictionary for matching
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
    """Extract recognized skills from resume text using pattern matching."""
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
    """Extract years of experience from resume text."""
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


def parse_resume(text: str) -> dict[str, Any]:
    """Parse resume text and return extracted information."""
    skills = extract_skills_from_text(text)
    experience = extract_experience_years(text)

    return {
        "extracted_skills": skills,
        "skill_count": len(skills),
        "experience_years": experience,
        "skill_names": [s["name"] for s in skills],
    }
