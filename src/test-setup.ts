beforeEach(() => {
    jest.spyOn(global.mailService, 'sendWelcomeEmail').mockImplementation(async () => {});
    jest.spyOn(global.mailService, 'sendInviteEmail').mockImplementation(async () => {});
    jest.spyOn(global.mailService, 'sendVerificationEmail').mockImplementation(async () => {});
    jest.spyOn(global.mailService, 'sendPasswordResetEmail').mockImplementation(async () => {});
});

