import { useState } from 'react'
import { getOrderCount } from './api'
import './index.css';

const PRODUCTS = [2142, 2181, 2201] as const;

function App() {
  
  const [selected, setSelected] = useState<number | "">("");
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const handleChange = async(e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelected(id);
    setCount(null);

    if(startDate && endDate) {
      await fetchOrderCount2(id, startDate, endDate);
    } else {
      await fetchOrderCount(id);
    }
  };

  const handleDateChange = async() => {
    if(selected && startDate && endDate) {
      await fetchOrderCount2(selected, startDate, endDate);
    }
  };

  const fetchOrderCount = async(productId: number) => {
    try {
      setLoading(true);
      const cnt = await getOrderCount(productId);
      setCount(cnt);
    } catch (err:unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  const fetchOrderCount2 = async(productId: number, start: string, end: string) => {
    try{
      setLoading(true);
      const formattedStart = formatDate(start);
      const formattedEnd = formatDate(end);
      const cnt = await getOrderCount(productId, formattedStart, formattedEnd);
      setCount(cnt);
    }catch(err:unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split("-");
    return `${month}/${day}/${year}`;
  }

  return (
    <main className='main'>
      <h2>Order Count</h2>

      <label htmlFor="productID" className='label'>
        Product:&nbsp;
        <select value={selected} onChange={handleChange}>
          <option value=""> Please choose an id </option>
          {PRODUCTS.map((p) => (
            <option value={p} key={p}>{p}</option>
          ))}
        </select>
      </label>

      <div className="date-range">
        <label htmlFor="startDate" className='label'>
          Start Date:&nbsp;
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label htmlFor="endDate" className='label'>
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
      {error && <p>{error}</p>}
    </main>
  );
};

export default App
