import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 1, // 1 virtual user
    iterations: 40, // 40 total iterations
};

export default function () {
    const res = http.get('http://localhost:8081/mongo');

    check(res, {
        'status is 200': (r) => r.status === 200,
        'response has data': (r) => r.json('randomNumber') !== undefined,
    });

    sleep(0.1); // Small delay between requests
}
