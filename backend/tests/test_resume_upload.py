import pytest
import io
from fastapi.testclient import TestClient
from app.main import app
from app.core.auth import get_current_user
from app.models.user import User
from app.services.resume_parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    parse_resume_regex,
    _parse_json_response
)

# Mock user for authentication dependency
def mock_get_current_user():
    return User(
        id=1,
        name="Test User",
        role="employee",
        email="employee@example.com",
        preferred_ai_provider="gemini",
        preferred_ai_model="gemini-2.5-flash"
    )

@pytest.fixture(autouse=True)
def setup_overrides():
    app.dependency_overrides[get_current_user] = mock_get_current_user
    yield
    if get_current_user in app.dependency_overrides:
        del app.dependency_overrides[get_current_user]

client = TestClient(app)


def test_resume_upload_size_limit():
    """Verify that uploading a file larger than 5MB returns 400."""
    large_data = b"x" * (5 * 1024 * 1024 + 1)
    file = ("resume.pdf", large_data, "application/pdf")
    response = client.post(
        "/skills/upload-resume",
        files={"file": file}
    )
    assert response.status_code == 400
    assert "exceeds" in response.json()["detail"]


def test_extract_text_from_invalid_pdf():
    """Verify that invalid pdf bytes do not crash the extractor and return empty text."""
    text = extract_text_from_pdf(b"invalid_pdf_bytes")
    assert text == ""


def test_extract_text_from_invalid_docx():
    """Verify that invalid docx bytes do not crash the extractor and return empty text."""
    text = extract_text_from_docx(b"invalid_docx_bytes")
    assert text == ""


def test_parse_resume_regex():
    """Verify that the regex fallback extractor parses skills and experience correctly."""
    resume_text = "Highly skilled software developer with 3 years of experience. Expert in Python, FastAPI, and Git."
    parsed = parse_resume_regex(resume_text)
    
    assert parsed["experience_years"] == 3.0
    assert "Python" in parsed["skill_names"]
    assert "FastAPI" in parsed["skill_names"]
    assert "Git" in parsed["skill_names"]
    assert parsed["parsed_by"] == "fallback_regex"


def test_parse_json_response():
    """Verify that _parse_json_response extracts and normalizes the AI output schema correctly."""
    raw_ai_output = """
    ```json
    {
      "experience_years": 4.5,
      "extracted_skills": [
        {"name": "React", "confidence": 0.95},
        {"name": "Node.js", "confidence": 0.8}
      ]
    }
    ```
    """
    parsed = _parse_json_response(raw_ai_output)
    assert parsed is not None
    assert parsed["experience_years"] == 4.5
    assert len(parsed["extracted_skills"]) == 2
    assert parsed["extracted_skills"][0]["name"] == "React"
    assert parsed["extracted_skills"][0]["confidence"] == 0.95
