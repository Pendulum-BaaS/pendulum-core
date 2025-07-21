import axios from "axios";
import type { DatabaseEvent } from "../events/eventEmitter";

type RealtimeFunction = (data: DatabaseEvent) => void;

export class BaaS {
  private readonly baseUrl: string;
  private subscriptions: Map<string, Set<RealtimeFunction>>;
  private eventSource: EventSource | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  constructor() {
    this.baseUrl = "http://localhost:3000/api";
    this.subscriptions = new Map();
    this.initializeEventSource();
  }

  private initializeEventSource() {
    if (this.eventSource) this.eventSource.close();
    this.eventSource = new EventSource("http://localhost:8080/events");
    this.eventSource.onmessage = (event) => { // event listener
      try {
        const data = JSON.parse(event.data);
        const callbacks = this.subscriptions.get(data.collection);
        if (callbacks) callbacks.forEach(cb => cb(data));
      } catch (error) {
        console.log("Error parsing SSE message:", error);
      }
    };

    this.eventSource.onopen = () => {
      console.log("SSE connection opened");
      this.reconnectAttempts = 0;
    };

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      this.handleReconnect();
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      console.log("Attempting to reconnect...");

      setTimeout(() => {
        this.initializeEventSource();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error("Max reconnection attempts reached. Please refresh.");
    };
  }

  subscribe(collection: string, callback: RealtimeFunction) {
    const collectionSub = this.subscriptions.get(collection);  // returns array of callback functions or undefined

    if (collectionSub === undefined) {
      this.subscriptions.set(collection, new Set([callback])); // create collection callback function Set inside subscriptions Map
    } else if (!collectionSub.has(callback)) {
      collectionSub.add(callback); // add callback function to existing callback function Set inside subscriptions Map
    }
  }

  unsubscribe(collection: string, callback: RealtimeFunction) {
    const collectionSub = this.subscriptions.get(collection);
    if (collectionSub === undefined || !collectionSub.has(callback)) return;
    collectionSub.delete(callback);
  }

  disconnect() { // currently unsubscribes all subscriptions; need to add functionality for multiple frontend components?
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    };

    this.subscriptions.clear();
  }

  async getOne(collection: string, id: string) {
    const response = await axios.get(`${this.baseUrl}/${id}`, {
      params: { collection },
    });
    return response.data;
  }

  async getSome(
    collection: string,
    limit: number = 10,
    offset: number = 0,
    sortKey: string,
  ) {
    const response = await axios.get(`${this.baseUrl}/some`, {
      params: { collection, limit, offset, sortKey },
    });
    return response.data;
  }

  async getAll(collection: string) {
    const response = await axios.get(this.baseUrl, { params: { collection } });
    return response.data;
  }

  async insert(collection: string, newItems: object[]) {
    const body = { collection, newItems };
    const response = await axios.post(this.baseUrl, body);
    return response.data;
  }

  async updateOne(
    collection: string,
    id: string,
    updateOperation: Record<string, any>, // change $set so frontend has better experience?
  ) {
    const body = { collection, updateOperation };
    const response = await axios.patch(`${this.baseUrl}/${id}`, body);
    return response.data;
  }

  async updateSome(
    collection: string,
    filter: Record<string, any>,
    updateOperation: Record<string, any>,
  ) {
    const body = { collection, filter, updateOperation };
    const response = await axios.patch(`${this.baseUrl}/some`, body);
    return response.data;
  }

  async updateAll(collection: string, updateOperation: Record<string, any>) {
    const body = { collection, updateOperation };
    const response = await axios.patch(this.baseUrl, body);
    return response.data;
  }

  async replace(collection: string, id: string, newItem: object) {
    const body = { collection, newItem };
    const response = await axios.put(`${this.baseUrl}/${id}`, body);
    return response.data;
  }

  async removeOne(collection: string, id: string) {
    const response = await axios.delete(`${this.baseUrl}/${id}`, {
      params: { collection },
    });
    return response.data;
  }

  async removeSome(collection: string, filter: Record<string, any>) {
    const response = await axios.delete(`${this.baseUrl}/some`, {
      params: { collection, ...filter },
    });
    return response.data;
  }

  async removeAll(collection: string) {
    const response = await axios.delete(this.baseUrl, {
      params: { collection },
    });
    return response.data;
  }
}
