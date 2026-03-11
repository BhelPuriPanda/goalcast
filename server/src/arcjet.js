import arcjet , {detectBot, shield, slidingWindow} from '@arcjet/node'

const arcjetKey = process.env.ARCJET_KEY
const arcjetMode = process.env.ARCJET_ENV === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';

if(!arcjetKey){
    throw new Error('ARCJET env key is missing') 
}

export const httpArcjet = arcjetKey ? 
    arcjet({
        key : arcjetKey,
        rules : [
            shield({mode:arcjetMode}),
            detectBot({mode:arcjetMode,allow:['CATEGORY:SEARCH_ENGINE','CATEGORY:PREVIEW']}),
            slidingWindow({mode:arcjetMode,interval:'10s',max:5})
        ]
    }) : null;

export const wsArcjet = arcjetKey ? 
    arcjet({
        key : arcjetKey,
        rules : [
            shield({mode:arcjetMode}),
            detectBot({mode:arcjetMode,allow:['CATEGORY:SEARCH_ENGINE','CATEGORY:PREVIEW']}),
            slidingWindow({mode:arcjetMode,interval:'2s',max:5})
        ]
    }) : null;


export function securityMiddleware() {
    return async (req , res ,next) => {
        if(!httpArcjet)return next();
        if(process.env.NODE_ENV !== 'production' && (req.hostname === 'localhost' || req.hostname === '127.0.0.1')) {
            return next();
        }

        try {
            const clientIp = 
                req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                req.headers['true-client-ip'] ||
                req.ip ||
                req.socket.remoteAddress;

            const decision = await httpArcjet.protect(req, {
                requested: 1,
                ip: clientIp 
            });

            if (decision.isDenied()) {
                if (decision.reason.isRateLimit()) {
                    return res.status(429).json({ error: 'Too Many Requests' });
                }
                // if (decision.reason.isBot()) {
                //     return res.status(403).json({ error: 'Bot detected' });
                // }
                return res.status(403).json({ error: 'Access Denied' });
            }

            next();
        } catch (err) {
            console.error('Arcjet error:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}
