export class ConfigurationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ConfigurationError';
    this.code = 'missing_configuration';
    this.details = details;
  }
}

export class InputError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'InputError';
    this.code = 'invalid_input';
    this.details = details;
  }
}

export class ProviderError extends Error {
  constructor(message, { status = null, retryable = false, details = {} } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.code = 'provider_error';
    this.status = status;
    this.retryable = retryable;
    this.details = details;
  }
}
