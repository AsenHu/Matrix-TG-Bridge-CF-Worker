const onRequestGet = async (context) => {
    // 检查 debug 是否开启
    const config = JSON.parse(context.env.config);
    if (!config.debug) {
        console.log("debug is off");
        return return_404();
    }

    // 生成 transaction_id
    const timestamp = Date.now();
    const sign = await sha512("Im_so_sleepy-" + timestamp + "-" + config.seed);
    const transaction_id = "Im_so_sleepy-" + timestamp + "-" + sign;

    // 构建 POST /_matrix/client/v1/appservice/{appserviceId}/ping
    const url = config.HS_API + "/_matrix/client/v1/appservice/" + config.App_Service.id + "/ping";
    const auth = `Bearer ${config.App_Service.as_token}`;
    const body = JSON.stringify({ "transaction_id": transaction_id });
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': auth
    };
    const init = {
        method: 'POST',
        headers: headers,
        body: body
    };
    console.log("POST", url, init);
    const response = await fetch(url, init);
    const responseBody = await response.text();
    console.log("response", response.status, responseBody);
    return new Response(responseBody, {
        status: response.status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
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
    return Array.from(new Uint8Array(myDigest)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function return_404() {
    return new Response(null, {
        status: 404,
        headers: {
            'Access-Control-Allow-Origin': '*'
        }
    });
}