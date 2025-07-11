import axios from "axios";

export class BaaS {
  private readonly baseUrl: string;
  
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
  }
  
  async getOne(collection: string, id: string) {
    const response = await axios.get(`${this.baseUrl}/${id}`, { params: { collection } });
    return response.data;
  }
  
  async getSome(
    collection: string,
    limit: number = 10,
    offset: number = 0,
    sortKey: string
  ) {
    const response = await axios.get(`${this.baseUrl}/some`, {
      params: { collection, limit, offset, sortKey }
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

  async updateOne(collection: string, id: string, updateOperation: Record<string, any>) {
    const body = { collection, updateOperation };
    const response = await axios.patch(`${this.baseUrl}/${id}`, body);
    return response.data;
  }

  async updateSome(collection: string, filter: Record<string, any>, updateOperation: Record<string, any>) {
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
    const response = await axios.delete(`${this.baseUrl}/${id}`, { params: { collection } });
    return response.data;
  }

  async removeSome(collection: string, filter: Record<string, any>) {
    const response = await axios.delete(`${this.baseUrl}/some`, { params: { collection, ...filter } });
    return response.data;
  }

  async removeAll(collection: string) {
    const response = await axios.delete(this.baseUrl, { params: { collection }});
    return response.data;
  }
}
