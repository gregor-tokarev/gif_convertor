import http from "k6/http";
import { check } from "k6";

// Load the file once at the global level
const file = open("assets/test_to-gif.mp4", "b");

export let options = {
    stages: [{ duration: "60s", target: 10 }],
};

export default function () {
    const data = {
        video: http.file(file, "test_to-gif.mp4"),
    };

    let res = http.post("http://localhost:3000/convert", data);

    check(res, {
        "is status 200": (r) => r.status === 200,
    });
}
