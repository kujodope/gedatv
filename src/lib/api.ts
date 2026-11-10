// Browser-side reads from the /api routes. One request per URL: callers that
// ask for the same thing (a hover, then a click) share the request in flight,
// and a finished answer is reused for the rest of the visit.
const requests = new Map<string, Promise<unknown>>();
const MAX_ENTRIES = 200;

export function getJSON<T>(url: string): Promise<T> {
    let request = requests.get(url) as Promise<T> | undefined;
    if (!request) {
        request = fetch(url).then((res) => {
            if (!res.ok) throw new Error(`${url} answered ${res.status}`);
            return res.json() as Promise<T>;
        });
        // A failure is forgotten so the next attempt asks again
        request.catch(() => requests.delete(url));
        if (requests.size >= MAX_ENTRIES) requests.delete(requests.keys().next().value!);
        requests.set(url, request);
    }
    return request;
}
