import { httpRouter } from "convex/server";

const http = httpRouter();

http.route({
  path: "/",
  method: "GET",
  handler: async () => {
    return new Response("Chat0 API is running", {
      status: 200,
    });
  },
});

export default http; 