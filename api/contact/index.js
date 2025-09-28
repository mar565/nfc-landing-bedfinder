// api/contact/index.js
const { app } = require('@azure/functions');

app.http('contact', {
    methods: ['POST', 'OPTIONS'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return {
                status: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Max-Age': '86400'
                }
            };
        }

        try {
            // Parse form data
            const formData = await request.json();
            const { name, email, message } = formData;
            
            // Sanitize inputs
            const sanitizedName = name?.trim();
            const sanitizedEmail = email?.trim().toLowerCase();
            const sanitizedMessage = message?.trim();
            
            // Validate required fields
            if (!sanitizedName || !sanitizedEmail || !sanitizedMessage) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Alle Felder sind erforderlich'
                    })
                };
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(sanitizedEmail)) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Ungültige E-Mail-Adresse'
                    })
                };
            }

            // Basic spam protection
            if (sanitizedMessage.length > 2000) {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Nachricht ist zu lang'
                    })
                };
            }

            // Additional spam protection - check for suspicious patterns
            const spamPatterns = [
                /\b(bitcoin|crypto|investment|loan|casino|gambling)\b/i,
                /\b(click here|visit now|act now|limited time)\b/i,
                /(http[s]?:\/\/[^\s]+){3,}/g, // Multiple URLs
                /(.)\1{10,}/g // Repeated characters
            ];

            const isSpam = spamPatterns.some(pattern => pattern.test(sanitizedMessage));
            if (isSpam) {
                context.log.warn('Potential spam detected:', {
                    name: sanitizedName,
                    email: sanitizedEmail,
                    ip: request.headers['x-forwarded-for'] || 'unknown'
                });
                
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    body: JSON.stringify({
                        success: false,
                        error: 'Nachricht konnte nicht gesendet werden. Bitte kontaktieren Sie uns direkt.'
                    })
                };
            }

            // Log the contact submission
            const contactData = {
                name: sanitizedName,
                email: sanitizedEmail,
                message: sanitizedMessage,
                timestamp: new Date().toISOString(),
                ip: request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown',
                userAgent: request.headers['user-agent'] || 'unknown'
            };
            
            context.log('Contact form submission:', contactData);
            
            // Here you can add email sending logic
            // Examples:
            // 1. Azure Communication Services Email
            // 2. SendGrid (see separate artifact for implementation)
            // 3. Office 365 SMTP
            // 4. Save to Azure Storage Table/CosmosDB
            
            // For now, we'll just log and return success
            // TODO: Add actual email sending implementation
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: true,
                    message: 'Vielen Dank! Ihre Nachricht wurde erfolgreich empfangen. Ich werde mich so schnell wie möglich bei Ihnen melden.'
                })
            };
            
        } catch (error) {
            context.log.error('Contact form error:', error);
            
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Serverfehler. Bitte versuchen Sie es später erneut.'
                })
            };
        }
    }
});
