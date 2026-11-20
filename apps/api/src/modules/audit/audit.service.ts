import { auditRepository } from "./audit.repository.js";

export const auditService = {
  async log(data: {
    actorId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Sanitize details to remove sensitive information
    const sanitizedDetails = data.details
      ? sanitizeLogDetails(data.details)
      : undefined;

    return auditRepository.create({
      ...data,
      details: sanitizedDetails,
    });
  },

  async getLogs(filters?: {
    actorId?: string;
    action?: string;
    entity?: string;
    page?: number;
    pageSize?: number;
  }) {
    return auditRepository.list(filters);
  },

  async getLogById(id: string) {
    return auditRepository.findById(id);
  },
};

function sanitizeLogDetails(details: string): string {
  // Remove potential sensitive information
  const sensitivePatterns = [
    /password["\s]*[:=]["\s]*[^",}]+/gi,
    /token["\s]*[:=]["\s]*[^",}]+/gi,
    /secret["\s]*[:=]["\s]*[^",}]+/gi,
    /authorization["\s]*[:=]["\s]*[^",}]+/gi,
  ];

  let sanitized = details;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, (match) => {
      const key = match.split(/[:=]/)[0];
      return `${key}: [REDACTED]`;
    });
  }

  return sanitized;
}
