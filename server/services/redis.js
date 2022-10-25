import { createClient, RedisClient } from "redis";

class Redis {
    client: RedisClient;

    connect = async () => {
        this.client = createClient({
            host: process.env.REDIS_HOST,
        });
        this.client.on("error", (error) => {
            console.log("ERROR", error);
        });
    };

    checkRedis = async (slug) => {
        return new Promise((resolve, reject) => {
            this.client.get(slug, (error, result) => {
                if (error) throw error;
                resolve(JSON.parse(result));
            });
        });
    };

    addToRedis = async (slug, data) => {
        this.client.setex(slug, 3600, JSON.stringify(data));
    };
}

const redis = new Redis();

export default redis;
