from typing import Dict, Any, List

SUPPORTED_LANGUAGES: Dict[str, Dict[str, Any]] = {
    "en": {"code": "en", "name": "English", "native_name": "English", "script": "Latn"},
    "te": {"code": "te", "name": "Telugu", "native_name": "తెలుగు", "script": "Telu"},
    "hi": {"code": "hi", "name": "Hindi", "native_name": "हिन्दी", "script": "Deva"},
    "ta": {"code": "ta", "name": "Tamil", "native_name": "தமிழ்", "script": "Taml"},
    "kn": {"code": "kn", "name": "Kannada", "native_name": "ಕನ್ನಡ", "script": "Knda"},
    "ml": {"code": "ml", "name": "Malayalam", "native_name": "മലയാളം", "script": "Mlym"},
    "bn": {"code": "bn", "name": "Bengali", "native_name": "বাংলা", "script": "Beng"},
    "mr": {"code": "mr", "name": "Marathi", "native_name": "मराठी", "script": "Deva"},
    "gu": {"code": "gu", "name": "Gujarati", "native_name": "ગુજરાતી", "script": "Gujr"},
    "pa": {"code": "pa", "name": "Punjabi", "native_name": "ਪੰਜਾਬੀ", "script": "Guru"},
    "or": {"code": "or", "name": "Odia", "native_name": "ଓଡ଼ିଆ", "script": "Orya"},
}

def is_supported_language(code: str) -> bool:
    return code.lower() in SUPPORTED_LANGUAGES

def get_language_meta(code: str) -> Dict[str, Any]:
    return SUPPORTED_LANGUAGES.get(code.lower(), SUPPORTED_LANGUAGES["en"])

def list_supported_languages() -> List[Dict[str, Any]]:
    return list(SUPPORTED_LANGUAGES.values())
