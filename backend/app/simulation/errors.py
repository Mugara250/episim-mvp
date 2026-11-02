class Cancelled(Exception):
    """Raised inside a model when the caller's should_cancel() turns true."""
