console.log('Loading function');

const doc = require('dynamodb-doc');

const dynamo = new doc.DynamoDB();

exports.handler = (event, context, callback) => {

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : event,
        headers: {
            'Content-Type': 'application/json',
        },
    });
    console.log(event);

    //=======================================================
    // VALIDATE
    if (!event) {
        done(new Error('Invalid request - missing body'));
        return;
    }
    done(new Error(event));
    var body = event;
    console.log(`User: ${body.userId}, Score: ${body.score}`);

    if (!body.score || !body.userId || !body.mode) {
        done(new Error('Invalid request - missing data'));
        return;
    }
    //=======================================================

    var score = parseInt(body.score);
    if (score == NaN || score < 0 || score > 1000) {
        done(new Error("Invalid request - s"));
        return;
    }

    var userId = body.userId;
    if (userId.length != 15) {
        done(new Error("Invalid request - u"));
        return;
    }

    var mode = parseInt(body.mode);
    if (mode == NaN || mode >= 2 || mode <= -1 ) {
        done(new Error("Invalid request - m"));
        return;
    }

    // Pseudo-unique UID - The scope/usage of this project means this should be 'good enough'
    var UID = Date.now().toString() + (Math.floor(Math.random() * (10))).toString();

    var time = new Date();

    var params = {
        'TableName': <TABLENAME>,
        'Item': {
            'guid' : UID,
            'userId': userId,
            'score': score,
            'time': time.toString(),
            'mode': mode
        },
        'ConditionExpression': 'attribute_not_exists(guid)'
    };

    console.log(params);

    dynamo.putItem(params, done);
};
