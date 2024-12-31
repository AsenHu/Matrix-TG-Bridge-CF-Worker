interface Context {
    env: { config: string };
    request: Request;
}

interface Body {
    transaction_id: string;
}

const onRequestPost = async (context: Context) => {
    // 鉴权
    const config = JSON.parse(context.env.config);
    const auth = context.request.headers.get('Authorization');
    if (auth !== `Bearer ${config.App_Service.hs_token}`) {
        return return_403();
    }

    // 获取请求
    const body: Body = await context.request.json();
    // body.transaction_id 应该为 "Im_so_sleepy-" + 时间戳 + "-" + 签名
    // 检查时间戳，不应超过 1 分钟
    const timestamp = parseInt(body.transaction_id.split('-')[1]);
    if (Date.now() - timestamp > 60000) {
        return return_403();
    }
    // 签名为 sha512("Im_so_sleepy-" + 时间戳 + "-" + config.seed)
    // 检查签名
    const sign = body.transaction_id.split('-')[2];
    if (sign !== sha512("Im_so_sleepy-" + timestamp + "-" + config.seed).toString()) {
        return return_403();
    }

    // 返回
    return return_200();
}

const onRequestOptions = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        }
    });
}

async function sha512(message: string) {
    const myText = new TextEncoder().encode(message);
    const myDigest = await crypto.subtle.digest(
        {
            name: 'SHA-512',
        },
        myText
    );
    return (new Uint8Array(myDigest));
}

async function return_403() {
    return new Response(JSON.stringify({ errcode: "M_FORBIDDEN" }), {
        status: 403,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        }
    });
}

async function return_200() {
    return new Response(JSON.stringify({}), {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        }
    });
}

export { onRequestPost, onRequestOptions };