class DomainError(Exception):
    """Base class for all domain-related errors."""

    def __init__(self, message: str, code: str = "DOMAIN_ERROR"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class ResourceNotFoundError(DomainError):
    """Raised when a requested resource is not found."""

    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(f"{resource_type} with ID {resource_id} not found", code="NOT_FOUND")


class BusinessRuleError(DomainError):
    """Raised when a business rule is violated."""

    def __init__(self, message: str):
        super().__init__(message, code="BUSINESS_RULE_VIOLATION")


class ExternalServiceError(DomainError):
    """Raised when an external API (SDS, Insight, Claude) fails."""

    def __init__(self, service_name: str, message: str):
        super().__init__(f"Error in {service_name}: {message}", code="EXTERNAL_SERVICE_ERROR")
