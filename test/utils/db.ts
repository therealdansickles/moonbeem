import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '../../src/lib/configs/db.config';

export const TypeOrmTestingModule = (entities: any[]) =>
    TypeOrmModule.forRoot({
        type: 'postgres',
        url: postgresConfig.url,
        autoLoadEntities: true,
        synchronize: false,
        extra: { max: 10 },
    });
