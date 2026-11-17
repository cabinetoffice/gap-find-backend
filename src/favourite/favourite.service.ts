import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { CreateFavouriteDto } from './favourite.dto';
import { Favourite } from './favourite.entity';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class FavouriteService {
    constructor(
        @InjectRepository(Favourite)
        private favouriteRepository: Repository<Favourite>,
        private userService: UserService,
    ) {}

    async create(dto: CreateFavouriteDto): Promise<Favourite> {
        const { sub, emailAddress, contentfulGrantId } = dto ?? {};
        if (!sub || !emailAddress || !contentfulGrantId) {
            throw new BadRequestException(
                'sub, emailAddress and contentfulGrantId are required',
            );
        }

        const user =
            (await this.findUser(sub, emailAddress)) ??
            (await this.userService.create(emailAddress, sub));

        const existing = await this.findOne(user.id, contentfulGrantId);
        if (existing) return existing;

        const favourite = new Favourite();
        favourite.userId = user.id;
        favourite.contentfulGrantId = contentfulGrantId;

        try {
            return await this.favouriteRepository.save(favourite);
        } catch (error) {
            // Another request added the same favourite at the same time
            if (error?.code === UNIQUE_VIOLATION) {
                return this.findOne(user.id, contentfulGrantId);
            }
            throw error;
        }
    }

    async findAllByUser(subOrEmailAddress: string): Promise<Favourite[]> {
        const user = await this.findUser(subOrEmailAddress, subOrEmailAddress);
        if (!user) return [];

        return this.favouriteRepository.find({
            where: { userId: user.id },
            order: { createdAt: 'DESC' },
        });
    }

    private async findUser(
        sub: string,
        emailAddress: string,
    ): Promise<User | null> {
        return (
            (await this.userService.findBySub(sub)) ??
            (await this.userService.findByEmail(emailAddress))
        );
    }

    private findOne(userId: number, contentfulGrantId: string) {
        return this.favouriteRepository.findOne({
            where: { userId, contentfulGrantId },
        });
    }
}
