"""Utilitários de validação e sanitização."""
import re
import bleach


def validate_cep(cep: str) -> bool:
    """Valida se o CEP está no formato correto (XXXXX-XXX ou XXXXXXXX)."""
    if not cep:
        return False

    # Remove caracteres não numéricos
    cep_clean = re.sub(r'\D', '', cep)

    # Deve ter exatamente 8 dígitos
    if len(cep_clean) != 8:
        return False

    return True


def sanitize_string(text: str, max_length: int = 1000) -> str:
    """Sanitiza uma string removendo tags HTML e limitando o tamanho."""
    if not text:
        return ""

    # Sanitizar HTML
    sanitized = bleach.clean(text, tags=[], strip=True)

    # Limitar tamanho
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]

    return sanitized.strip()