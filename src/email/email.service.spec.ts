import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
//notifications-node-client currently has no type definitions
import { NotifyClient } from 'notifications-node-client';

jest.mock('notifications-node-client');

describe('EmailService', () => {
    let service: EmailService;

    beforeEach(async () => {
        NotifyClient.mockClear();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                EmailService,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest
                            .fn()
                            .mockReturnValue('mock-env-variable-value'),
                    },
                },
            ],
        }).compile();

        service = module.get<EmailService>(EmailService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should attempt to send an e-mail', async () => {
        const email = 'testemail@and.digital';
        const templateId = 'test-template-id';
        const personalisation = { greeting: 'Hello' };
        const reference = 'test-reference';

        await service.send(email, templateId, personalisation, reference);

        const mockSendEmail = NotifyClient.mock.instances[0].sendEmail;
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
        expect(mockSendEmail).toHaveBeenCalledWith(templateId, email, {
            personalisation,
            reference,
        });
    });
});
