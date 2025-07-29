export interface PetEventContext {
    petName: string;
    petBreed?: string;
    eventTitle: string;
    eventDate: string;
    userName?: string;
}
export interface AINotificationContent {
    subject: string;
    friendlyReminder: string;
    careTip: string;
    success: boolean;
    error?: string;
}
export interface AIContentServiceConfig {
    geminiApiKey: string;
    rateLimitPerHour?: number;
}
export declare class AIContentService {
    private genAI;
    private model;
    private config;
    constructor(config: AIContentServiceConfig);
    /**
     * Generate AI-powered notification content in Simplified Chinese
     */
    generateNotificationContent(context: PetEventContext): Promise<AINotificationContent>;
    /**
     * Create the prompt for generating notification content in Chinese
     */
    private createNotificationPrompt;
    /**
     * Parse the AI-generated content from JSON format
     */
    private parseGeneratedContent;
    /**
     * Create fallback content when AI service fails
     */
    private createFallbackContent;
    private createFallbackSubject;
    private createFallbackReminder;
    private createFallbackTip;
    /**
     * Validate the generated content meets basic requirements
     */
    private validateContent;
}
