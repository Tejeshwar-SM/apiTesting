import { useState } from "react";
import { getOrderCount } from "./api";
import "./index.css";

interface Order {
  order_id: string;
  acquisition_date: string;
  billing_first_name: string;
  billing_last_name: string;
  email_address: string;
  order_total: string;
  order_status: string;
}

const PRODUCTS = [2142, 2181, 2201] as const;

function App() {
  const [selected, setSelected] = useState<number | "">("");
  const [count, setCount] = useState<number | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelected(id);
    setCount(null);
    setOrders([]);

    if (startDate && endDate) {
      await fetchOrderCount2(id, startDate, endDate);
    } else {
      await fetchOrderCount(id);
    }
  };

  const handleDateChange = async () => {
    if (selected && startDate && endDate) {
      await fetchOrderCount2(selected, startDate, endDate);
    }
  };

  const fetchOrderCount = async (productId: number) => {
    try {
      setLoading(true);
      const formattedStart = formatDate("2000-01-01");
      const formattedEnd = formatDate("2100-01-01");
      const [cnt, orderIDs, orderData] = await getOrderCount(
        productId,
        formattedStart,
        formattedEnd
      );
      setCount(cnt);

      // ✅ Simplified - no mapping needed
      setOrders(Object.values(orderData || {}));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderCount2 = async (
    productId: number,
    start: string,
    end: string
  ) => {
    try {
      setLoading(true);
      const formattedStart = formatDate(start);
      const formattedEnd = formatDate(end);
      const [cnt, orderIDs, orderData] = await getOrderCount(
        productId,
        formattedStart,
        formattedEnd
      );
      setCount(cnt);

      
      setOrders(Object.values(orderData || {}));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-");
    return `${month}/${day}/${year}`;
  }

  return (
    <main className="main">
      <h2>Order Count</h2>

      <label htmlFor="productID" className="label">
        Product:&nbsp;
        <select value={selected} onChange={handleChange}>
          <option value=""> Please choose an id </option>
          {PRODUCTS.map((p) => (
            <option value={p} key={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <div className="date-range">
        <label htmlFor="startDate" className="label">
          Start Date:&nbsp;
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label htmlFor="endDate" className="label">
          End Date:&nbsp;
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <button onClick={handleDateChange} disabled={!startDate || !endDate}>
          Fetch Orders
        </button>
      </div>

      {loading && <p>Fetching Orders...</p>}
      {count !== null && !loading && <p>Orders: {count.toLocaleString()}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {orders.length > 0 && (
        <table className="order-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Order ID</th>
              <th>Acquisition Date</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Total ($)</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.order_id}>
                <td>{index + 1}</td>
                <td>{order.order_id}</td>
                <td>{order.acquisition_date}</td>
                <td>{order.billing_first_name}</td>
                <td>{order.billing_last_name}</td>
                <td>{order.email_address}</td>
                <td>{order.order_total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

export default App;
