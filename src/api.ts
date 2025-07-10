import axios from "axios";

// Interfaces for type safety
interface OrderRow {
  order_id: string;
  acquisition_date: string;
  billing_first_name: string;
  billing_last_name: string;
  email_address: string;
  order_total: string;
  order_status: string;
}

interface CacheEntry {
  timestamp: number;
  count: number;
  orderID: string[];
  orderData: Record<string, OrderRow>;
}

interface APIResponse {
  response_code: string;
  total_orders?: string;
  order_id?: string[];
  data?: Record<string, any>;  // Ideally replace `any` with a better type
}

// Axios instance for API requests
const api = axios.create({
  baseURL: import.meta.env.VITE_STICKY_BASE,
  auth: {
    username: import.meta.env.VITE_STICKY_UNAME,
    password: import.meta.env.VITE_STICKY_PASSWD,
  },
  headers: { "Content-Type": "application/json" },
});

// Function to fetch order count
export async function getOrderCount(
  productID: number,
  startDate: string = "01/01/2000",
  endDate: string = "01/01/2100"
): Promise<[number, string[], Record<string, OrderRow>]> {

  // Create a key for caching
  const cachedKey = `order_count_${productID}_${startDate}_${endDate}`;
  const cachedItem = localStorage.getItem(cachedKey);

  // Check if we have a cached item
  if (cachedItem) {
    const parsed: CacheEntry = JSON.parse(cachedItem);
    const now = Date.now();
    const threshold = 15 * 60 * 1000;  // 15 minutes

    // Return from cache if the data is fresh enough
    if (now - parsed.timestamp < threshold) {
      return [parsed.count, parsed.orderID ?? [], parsed.orderData ?? {}];
    }
  }

  // Make the API request
  const req_body = {
    campaign_id: "all",
    start_date: startDate,
    end_date: endDate,
    start_time: "",
    end_time: "",
    product_id: [productID],
    criteria: "all",
    search_type: "all",
    return_type: "order_view",
  };

  const { data }: { data: APIResponse } = await api.post("order_find", req_body);

  // Error handling
  if (data.response_code !== "100") throw new Error("API Error");

  const count = Number(data.total_orders ?? 0);
  const orderID = data.order_id ?? [];
  const orderData = data.data ?? {};

  // Trim order data to selected fields
  const trimmedOrderData: Record<string, OrderRow> = {};
  Object.entries(orderData).forEach(([id, order]) => {
    if (typeof order === "object" && order !== null) {
      const o = order as Record<string, unknown>;  // Assuming `order` is an object
      trimmedOrderData[id] = {
        order_id: id,
        acquisition_date: o.acquisition_date as string || "",
        billing_first_name: o.billing_first_name as string || "",
        billing_last_name: o.billing_last_name as string || "",
        email_address: o.email_address as string || "",
        order_total: o.order_total as string || "0",
        order_status: o.order_status as string || "unknown",
      };
    }
  });

  // Store the result in localStorage for caching
  localStorage.setItem(
    cachedKey,
    JSON.stringify({ count, timestamp: Date.now(), orderID, orderData: trimmedOrderData })
  );

  // Clear older caches
  clearCache();

  return [count, orderID, trimmedOrderData];
}


function clearCache(): void {
  try {
    const cachedKeys = Object.keys(localStorage).filter((key) => key.startsWith("order_count"));

    if (cachedKeys.length <= 5) {
      return;
    }

    const keyTimestamps = cachedKeys.map((key) => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        return {
          key,
          timestamp: data.timestamp || 0,
        };
      } catch {
        return { key, timestamp: 0 };
      }
    });

    keyTimestamps
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, keyTimestamps.length - 5)
      .forEach(({ key }) => {
        localStorage.removeItem(key);
      });
  } catch (error) {
    console.error("Error clearing cache:", error);
  }
}
