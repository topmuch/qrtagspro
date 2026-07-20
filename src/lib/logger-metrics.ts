/**
 * Metric logger for QRTags services (Groq, Wakit, WhatsApp, Suivi, baggage-status, qrtags).
 * Lightweight structured logging for service metrics.
 * Separate from the main logger to avoid circular dependencies.
 */

interface MetricOptions {
  key?: string;
  details?: string;
}

export function logMetric(
  service: 'groq' | 'wakit' | 'whatsapp' | 'suivi' | 'baggage-status' | 'qrtags' | 'activate' | 'scan',
  action: string,
  latencyMs: number,
  success: boolean,
  options?: MetricOptions
): void {
  const icon = success ? '✅' : '❌';
  const keyPart = options?.key ? ` [key=${options.key}]` : '';
  const detailsPart = options?.details ? ` [${options.details}]` : '';

  console.log(
    `[${service}/${action}] ${icon} ${latencyMs}ms${keyPart}${detailsPart}`
  );
}
