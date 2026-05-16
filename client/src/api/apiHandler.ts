import type { AxiosResponse, AxiosError } from "axios";
import { notify } from "../util/notify";

type HandleRequestOptions = {
    returnFullResponse?: boolean;
    silentStatuses?: number[];
};

export async function handleRequest<T>(
    request: Promise<AxiosResponse<T>>,
    errorMessage = "An unexpected error occurred.",
    options: HandleRequestOptions = {}
): Promise<T | AxiosResponse<T>> {
    const {
        returnFullResponse = false,
        silentStatuses = [401, 422, 503],
    } = options;

    try {
        const response = await request;
        return returnFullResponse ? response : response.data;
    } catch (err) {
        const error = err as AxiosError;

        const status = error.response?.status;

        if (!status || !silentStatuses.includes(status)) {
            notify.error(errorMessage);
        }

        throw error;
    }
}