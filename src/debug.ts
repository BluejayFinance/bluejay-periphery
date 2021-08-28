import debug from "debug";

export const LOGGER_NAMESPACE = "bluejay-periphery";

const logger = debug(LOGGER_NAMESPACE);

export const trace = (namespace: string) => logger.extend(`trace:${namespace}`);
export const info = (namespace: string) => logger.extend(`info:${namespace}`);
export const error = (namespace: string) => logger.extend(`error:${namespace}`);

export const getLogger = (namespace: string) => ({
  trace: trace(namespace),
  info: info(namespace),
  error: error(namespace),
});

export const enableAllLog = () => debug.enable(`${LOGGER_NAMESPACE}:*`);
export const enableInfo = () => debug.enable(`${LOGGER_NAMESPACE}:info:*`);
export const enableTrace = () => debug.enable(`${LOGGER_NAMESPACE}:trace:*`);
export const enableError = () => debug.enable(`${LOGGER_NAMESPACE}:error:*`);
