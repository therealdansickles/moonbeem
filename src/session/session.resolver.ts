import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { Public } from './session.decorator';

import { Session, CreateSessionInput, CreateSessionFromEmailInput, CreateSessionFromGoogleInput } from './session.dto';
import { SessionService } from './session.service';

@Resolver(() => Session)
export class SessionResolver {
    constructor(private readonly sessionService: SessionService) {}

    @Public()
    @Mutation(() => Session, { description: 'Create a session.', nullable: true })
    async createSession(@Args('input') input: CreateSessionInput): Promise<Session | null> {
        const { address, message, signature } = input;
        return this.sessionService.createSession(address, message, signature);
    }

    @Public()
    @Mutation(() => Session, { description: 'Create a session from email.', nullable: true })
    async createSessionFromEmail(@Args('input') input: CreateSessionFromEmailInput): Promise<Session | null> {
        const { email, password } = input;
        return this.sessionService.createSessionFromEmail(email, password);
    }

    @Public()
    @Mutation(() => Session, { description: 'Create a session from google', nullable: true })
    async createSessionFromGoogle(@Args('input') input: CreateSessionFromGoogleInput): Promise<Session | null> {
        return this.sessionService.createSessionFromGoogle(input.accessToken);
    }
}
