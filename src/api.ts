import axios from "axios";

const api = axios.create({
    baseURL:import.meta.env.VITE_STICKY_BASE,
    auth: {
        username:import.meta.env.VITE_STICKY_UNAME,
        password:import.meta.env.VITE_STICKY_PASSWD,
    },
    headers: {"Content-Type": "application/json"},
});

export async function getOrderCount(
    productID: number,
    startDate:string = "01/01/2000",
    endDate:string = "01/01/2100") {

    const cachedKey = `order_count_${productID}_${startDate}_${endDate}`;
    const cachedItem = localStorage.getItem(cachedKey);

    if(cachedItem) {
        const parsed = JSON.parse(cachedItem);
        const now = Date.now();
        const threshold = 15*60*1000;//15mins
        if(now - parsed.timestamp < threshold) {
            return [parsed.count, parsed.orderIDs ?? [], parsed.orderData ?? {}];
        }
    }

    const req_body = {
    campaign_id: "all",
    start_date: startDate,
    end_date:   endDate,
    start_time: "",
    end_time:   "",
    product_id: [productID],
    criteria:   "all",
    search_type:"all",
    return_type: "order_view"
    };
    
    const {data} = await api.post("order_find", req_body);
    if(data.response_code !== "100") throw new Error("API Error");
    const count = Number(data.total_orders ?? 0);
    const orderID = data.order_id;
    const orderData = data.data;

    localStorage.setItem(cachedKey, JSON.stringify({count, timestamp:Date.now()}));
    return [count, orderID, orderData];
}