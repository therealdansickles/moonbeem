import { AuthPayload } from 'src/auth/auth.service';

export const getVerificationEmailTemplate = (url: string): string => {
    return `<div style='background: #F7F8FC'>
    <div style='text-align:center;padding-top:60px; font-family: "Trebuchet MS"'>
        <div>
            <img src="https://arweave.net/tZ2u8l_bKV5tcNEOLUB-3fMnBhLxyGGsWbLahVyOUL0" alt="vibe logo" style='max-width:100px'/>
        </div>
        <div>
            <h1 style='font-size:36px;'>Your Signup Verification Code</h1>
        </div>
        <div>
            <p style='font-size:16px;color:#5B5F5F'>Please verify your account</p>
        </div>
        <div style='padding-bottom: 32px;'>
              <div style='max-width: 650px; width:100%; height: 5px; background: #18E16A; border-radius: 4px 4px 0px 0px; margin:50px auto 0'></div>

            <div style='padding: 48px 48px 32px 48px; background:#fff;max-width:556px;width:100%;margin:0 auto;text-align: left;font-size:18px'>
                <img src="https://f5kbg2chgs2vo5fn3ixycim553bexclobe22rj67gdbsq5dtrkoa.arweave.net/L1QTaEc0tVd0rdovgSGd7sJLiW4JNain3zDDKHRzipw" alt="key logo" style="max-width: 80px; padding-bottom: 40px"/>
              <h1 style='font-size:22px; margin-top:0px'>
                Hello and welcome!
              </h1>
              <p style='font-size:16px;color:#5B5F5F; line-height: 24px;margin-bottom:32px'>
                Please click on this link to verify your account.
              </p>
              <a href="${url}" style='gap: 6px;border-radius: 4px;margin-top:42px; background: #13B453;padding:10px 20px; color: #F7FBFD; font-size:16px;text-decoration:none; line-height: 24px; font-weight:700;'>Verify Account</a>
<div style='height:1px;background:#DDE3E3;max-width:650px;width:100%;margin-top:32px'></div>
                                <p style='margin-top:32px;color:#5B5F5F;line-height:24px;font-size:16px;'>
                If you think you received this email by mistake, feel free to ignore it.
              </p>
              <p style='margin-top:32px;margin-bottom:2px;color:#5B5F5F;line-height:24px;font-size:16px;'>
                Vibe with us,
              </p>
              <p style='margin-top:0px;line-height:24px;font-size:16px;'>
                 Your friends at Vibe.xyz
              </p>
            </div>
        </div>
        <div style='max-width: 650px; width:100%; padding-bottom: 32px; margin: 0 auto;text-align:left'>
            <img src="https://arweave.net/tZ2u8l_bKV5tcNEOLUB-3fMnBhLxyGGsWbLahVyOUL0" alt="vibe logo" style='max-width:100px'/>
          <a href="https://twitter.com/vibexyz_"><img src="https://arweave.net/YUTSEsYDLTfsr-_Emm4s_lYxA_7knLbzn64W75R4IyE" alt="twitter logo" style='width:17px;padding-bottom:10px;padding-left:75%'/></a>
            <a href="https://instragram.com"><img src="https://arweave.net/lw5mNU09nCC4sAXYO3Ja0urvTzSJ9H92SLp4cySri6I" alt="twitter logo" style='width:17px;padding-bottom:10px;padding-left:13px'/></a>
        </div>
    </div>
</div>`;
};

export const getWelcomeEmailTemplate = (): string => {
    return `<div style='background: #F7F8FC'>
    <div style='text-align:center;padding-top:60px; font-family: "Trebuchet MS"'>
        <div>
            <img src="https://arweave.net/tZ2u8l_bKV5tcNEOLUB-3fMnBhLxyGGsWbLahVyOUL0" alt="vibe logo" style='max-width:100px'/>
        </div>
        <div>
            <h1 style='font-size:36px;'>Welcome to vibe.xyz</h1>
        </div>
        <div>
            <p style='font-size:16px'>Manage all of your NFTs at once.</p>
        </div>
        <div style='padding-bottom: 32px;'>
              <div style='max-width: 650px; width:100%; height: 5px; background: #18E16A; border-radius: 4px 4px 0px 0px; margin:50px auto 0'></div>

            <div style='padding: 48px 48px 32px 48px; background:#fff;max-width:556px;width:100%;margin:0 auto;text-align: left;font-size:18px'>
                <img src="https://rlrbe3ylvbobksihdz6srs6r2mm55wctscxcxpsgnhxu3rgoqjdq.arweave.net/iuISbwuoXBVJBx59KMvR0xne2FOQriu-RmnvTcTOgkc" alt="key logo" style="max-width: 80px; padding-bottom: 40px"/>
              <h1 style='font-size:22px; margin-top:0px'>
                Thank you for signing up at Vibe.xyz!
              </h1>
              <p style='font-size:16px;color:#5B5F5F; line-height: 24px;margin-bottom:32px'>
                This email is to confirm that your account is activated and ready to mint, manage, and sell NFTs with your team on Vibe.xyz. 
              </p>
              <div style='background: #ECF1F1; padding:24px'>
                <p style='font-size:16px;line-height:24px;font-weight:700'>Next steps:</p>
                <ul style='font-size:16px;line-height:24px;'>
                  <li>Go to your dashboard to follow the set up guide.</li>
                  <li>Follow us on twitter to get newest updates</li>
                                        <li>Join our discord for get early  notification on upcoming VIP drops</li>
                </ul>
              </div>
              <div style='height:1px;background:#DDE3E3;max-width:650px;width:100%;margin-top:32px'></div>
                                <p style='margin-top:32px;color:#5B5F5F;line-height:24px;font-size:16px;'>
                If you think you received this email by mistake, feel free to ignore it.
              </p>
              <p style='margin-top:32px;margin-bottom:2px;color:#5B5F5F;line-height:24px;font-size:16px;'>
                Vibe with us,
              </p>
              <p style='margin-top:0px;line-height:24px;font-size:16px;'>
                 Your friends at Vibe.xyz
              </p>
            </div>
        </div>
        <div style='max-width: 650px; width:100%; padding-bottom: 32px; margin: 0 auto;text-align:left'>
            <img src="https://arweave.net/tZ2u8l_bKV5tcNEOLUB-3fMnBhLxyGGsWbLahVyOUL0" alt="vibe logo" style='max-width:100px'/>
          <a href="https://twitter.com/vibexyz_"><img src="https://arweave.net/YUTSEsYDLTfsr-_Emm4s_lYxA_7knLbzn64W75R4IyE" alt="twitter logo" style='width:17px;padding-bottom:10px;padding-left:75%'/></a>
            <a href="https://instragram.com"><img src="https://arweave.net/lw5mNU09nCC4sAXYO3Ja0urvTzSJ9H92SLp4cySri6I" alt="twitter logo" style='width:17px;padding-bottom:10px;padding-left:13px'/></a>
        </div>
    </div>
</div>`;
};

export const getPasswordResetEmail = (url: string, name: string): string => {
    return `<div style='background: #F7F8FC'>
    <div style='text-align:center;padding-top:60px; font-family: "Trebuchet MS"'>
        <div>
            <img src="https://arweave.net/tZ2u8l_bKV5tcNEOLUB-3fMnBhLxyGGsWbLahVyOUL0" alt="vibe logo" style='max-width:100px'/>
        </div>
        <div>
            <h1 style='font-size:36px;'>Need to reset your password?</h1>
        </div>
        <div>
            <p style='font-size:16px'>Password reset instructions</p>
        </div>
        <div style='padding-bottom: 32px;'>
              <div style='max-width: 650px; width:100%; height: 5px; background: #18E16A; border-radius: 4px 4px 0px 0px; margin:50px auto 0'></div>

            <div style='padding: 48px 48px 32px 48px; background:#fff;max-width:556px;width:100%;margin:0 auto;text-align: left;font-size:18px'>
                <img src="https://arweave.net/dgT7j_78DphIjveN8HGCFRlQuKwf1QK_RKGKZKLEl4Q" alt="key logo" style="max-width: 80px; padding-bottom: 40px"/>
              <h1 style='font-size:22px; margin-top:0px'>
                Hi ${name},
              </h1>
              <p style='font-size:16px;color:#5B5F5F; line-height: 24px;margin-bottom:42px'>
                There was a request to change your password, Please click below button to change your password:
              </p>
              <a href="${url}" style='gap: 6px;border-radius: 4px;margin-top:42px; background: #13B453;padding:10px 20px; color: #F7FBFD; font-size:16px;text-decoration:none; line-height: 24px; font-weight:700;'>Password Reset</a>
              <div style='height:1px;background:#DDE3E3;max-width:650px;width:100%;margin-top:32px'></div>
                                <p style='margin-top:32px;color:#5B5F5F;line-height:24px;font-size:16px;'>
                If you think you received this email by mistake, feel free to ignore it.
              </p>
              <p style='margin-top:32px;margin-bottom:2px;color:#5B5F5F;line-height:24px;font-size:16px;'>
                Vibe with us,
              </p>
              <p style='margin-top:0px;line-height:24px;font-size:16px;'>
                 Your friends at Vibe.xyz
              </p>
            </div>
        </div>
        <div style='max-width: 650px; width:100%; padding-bottom: 32px; margin: 0 auto;text-align:left'>
            <img src="https://arweave.net/tZ2u8l_bKV5tcNEOLUB-3fMnBhLxyGGsWbLahVyOUL0" alt="vibe logo" style='max-width:100px'/>
          <a href="https://twitter.com/vibexyz_"><img src="https://arweave.net/YUTSEsYDLTfsr-_Emm4s_lYxA_7knLbzn64W75R4IyE" alt="twitter logo" style='width:17px;padding-bottom:10px;padding-left:75%'/></a>
            <a href="https://instragram.com"><img src="https://arweave.net/lw5mNU09nCC4sAXYO3Ja0urvTzSJ9H92SLp4cySri6I" alt="twitter logo" style='width:17px;padding-bottom:10px;padding-left:13px'/></a>
        </div>
    </div>
</div>`;
};

export const getUserInviteEmail = (url: string, user: AuthPayload, orgName: string): string => {
    return `<div style='background: #F7F8FC'>
    <div style='text-align:center;padding-top:60px; font-family: "Trebuchet MS"'>
        <div>
            <img src="https://arweave.net/tZ2u8l_bKV5tcNEOLUB-3fMnBhLxyGGsWbLahVyOUL0" alt="vibe logo" style='max-width:100px'/>
        </div>
        <div>
            <h1 style='font-size:36px;'>${user.email || user.address} Has Invited you!</h1>
        </div>
        <div>
            <p style='font-size:16px'>Join us!</p>
        </div>
        <div style='padding-bottom: 32px;'>
              <div style='max-width: 650px; width:100%; height: 5px; background: #18E16A; border-radius: 4px 4px 0px 0px; margin:50px auto 0'></div>

            <div style='padding: 48px 48px 32px 48px; background:#fff;max-width:556px;width:100%;margin:0 auto;text-align: left;font-size:18px'>
                <img src="https://dknvqkynn46uqqif5llbwfamt2vgcah7vvp3zcyn64nx46osmasa.arweave.net/GptYKw1vPUhBBerWGxQMnqphAP-tX7yLDfcbfnnSYCQ" alt="key logo" style="max-width: 80px; padding-bottom: 40px"/>
              <h1 style='font-size:22px; margin-top:0px'>
                Invite
              </h1>
              <p style='font-size:16px;color:#5B5F5F; line-height: 24px;margin-bottom:32px'>
                You've been invited to workspace "${orgName}" by ${user.email || user.address}
              </p>
              <a href="${url}" style='gap: 6px;border-radius: 4px;margin-top:42px; background: #13B453;padding:10px 20px; color: #F7FBFD; font-size:16px;text-decoration:none; line-height: 24px; font-weight:700;'>Click Here to Join</a>

              <p style='margin-top:32px;margin-bottom:2px;color:#5B5F5F;line-height:24px;font-size:16px;'>
                Vibe with us,
              </p>
              <p style='margin-top:0px;line-height:24px;font-size:16px;'>
                 Your friends at Vibe.xyz
              </p>
            </div>
        </div>
        <div style='max-width: 650px; width:100%; padding-bottom: 32px; margin: 0 auto;text-align:left'>
            <img src="https://arweave.net/tZ2u8l_bKV5tcNEOLUB-3fMnBhLxyGGsWbLahVyOUL0" alt="vibe logo" style='max-width:100px'/>
          <a href="https://twitter.com/vibexyz_"><img src="https://arweave.net/YUTSEsYDLTfsr-_Emm4s_lYxA_7knLbzn64W75R4IyE" alt="twitter logo" style='width:17px;padding-bottom:10px;padding-left:75%'/></a>
            <a href="https://instragram.com"><img src="https://arweave.net/lw5mNU09nCC4sAXYO3Ja0urvTzSJ9H92SLp4cySri6I" alt="twitter logo" style='width:17px;padding-bottom:10px;padding-left:13px'/></a>
        </div>
    </div>
</div>`;
};
