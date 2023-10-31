import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Newsletter, NewsletterType } from './newsletter.entity';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';

@Injectable()
export class NewsletterService {
    constructor(
        @InjectRepository(Newsletter)
        private newsletterRepository: Repository<Newsletter>,
        private userService: UserService,
    ) {}

    async findAll() {
        return this.newsletterRepository.find();
    }

    async findOneById(id: number) {
        return this.newsletterRepository.findOne({ where: { id } });
    }

    async findAllByType(type: NewsletterType) {
        return this.newsletterRepository.find({
            where: { type },
            relations: ['user'],
        });
    }

    async findOneBySubOrEmailAddressAndType(
        id: string,
        type: NewsletterType,
    ): Promise<Newsletter> {
        let user = await this.userService.findBySub(id);
        if (!user) {
            user = await this.userService.findByEmail(id);
        }
        if (!!user) {
            return await this.newsletterRepository.findOne({
                where: { user, type },
            });
        }
    }

    async create(
        email: string,
        type: NewsletterType,
        sub?: string,
    ): Promise<Newsletter> {
        const id = sub ?? email;
        const newsletter = await this.findOneBySubOrEmailAddressAndType(
            id,
            type,
        );

        if (!newsletter) {
            const user = await this.userService.create(email);

            const newsletter = new Newsletter();
            newsletter.type = type;
            newsletter.user = user;

            return await this.newsletterRepository.save(newsletter);
        } else {
            return newsletter;
        }
    }

    async deleteByNewsletterId(id: number) {
        const deleteResponse = await this.newsletterRepository.delete({ id });
        return deleteResponse.affected;
    }

    async deleteBySubAndType(
        sub: string,
        type: NewsletterType,
    ): Promise<DeleteResult> {
        const user = await this.userService.findBySub(sub);
        return await this.deleteByUserAndType(user, type);
    }

    async deleteByEmailAddressAndType(email: string, type: NewsletterType) {
        const user = await this.userService.findByEmail(email);
        return await this.deleteByUserAndType(user, type);
    }

    async deleteByUserAndType(user: User, type: NewsletterType) {
        if (!user) {
            return {
                raw: null,
                affected: 0,
            };
        }
        const deleteResult = await this.newsletterRepository.delete({
            user,
            type,
        });
        return deleteResult;
    }
}
