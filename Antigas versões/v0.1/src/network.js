/**
 * Camada de rede preparada para o backend.
 * Protocolo sugerido:
 * client -> { type: "join", mode: "survival", nickname: "Player" }
 * client -> { type: "input", seq, moveX, moveY, yaw, pitch, fire, jump }
 * server -> { type: "snapshot", tick, players: [], zombies: [], projectiles: [] }
 *
 * O servidor deverá validar movimento, dano, acertos e estado da partida.
 */
export class NetworkClient {
  constructor(url = "") {
    this.url = url;
    this.socket = null;
    this.connected = false;
    this.handlers = new Map();
  }

  on(type, callback) {
    this.handlers.set(type, callback);
  }

  emit(type, payload = {}) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify({ type, ...payload }));
    return true;
  }

  connect() {
    if (!this.url) {
      this.dispatch("offline", { reason: "URL do servidor ainda não configurada" });
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      try {
        this.socket = new WebSocket(this.url);
        this.socket.addEventListener("open", () => {
          this.connected = true;
          this.dispatch("connected", {});
          resolve(true);
        }, { once: true });
        this.socket.addEventListener("message", (event) => {
          try {
            const message = JSON.parse(event.data);
            this.dispatch(message.type, message);
          } catch (error) {
            console.warn("Mensagem de rede inválida", error);
          }
        });
        this.socket.addEventListener("close", () => {
          this.connected = false;
          this.dispatch("disconnected", {});
        });
        this.socket.addEventListener("error", () => {
          this.dispatch("network-error", {});
          resolve(false);
        }, { once: true });
      } catch (error) {
        this.dispatch("network-error", { error });
        resolve(false);
      }
    });
  }

  dispatch(type, data) {
    this.handlers.get(type)?.(data);
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.connected = false;
  }
}
