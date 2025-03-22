import { PromptConfig } from '../config';

export class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TemplateError';
  }
}

export function validateParameters(
  config: PromptConfig,
  parameters: Record<string, any>,
): void {
  const missingParams = config.parameters
    .filter((param) => param.required && !(param.name in parameters))
    .map((param) => param.name);

  if (missingParams.length > 0) {
    throw new TemplateError(
      `Missing required parameters: ${missingParams.join(', ')}`,
    );
  }
}

export function renderTemplate(
  template: string,
  parameters: Record<string, any>,
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const trimmedKey = key.trim();
    if (!(trimmedKey in parameters)) {
      throw new TemplateError(`Missing parameter: ${trimmedKey}`);
    }
    return String(parameters[trimmedKey]);
  });
}

export function processPrompt(
  config: PromptConfig,
  parameters: Record<string, any>,
): string {
  validateParameters(config, parameters);
  return renderTemplate(config.template, parameters);
}
