import { useState } from "react";
import './styles.css';

function calculateMortgage(principal, annualRate = 0.06, years = 25) {
  const monthlyRate = annualRate / 12 / 100;
  const n = years * 12;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
}

const AVAILABLE_RATES = [3, 4, 5, 6];
const KEYWORDS = {
  garden: "garden",
  balcony: "balcony",
  offStreet: "off_street_parking",
  greenSpaces: "green"
};

export default function Home() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    budget: "",
    location: "",
    bedrooms: "",
    depositPercent: 10,
    interestRate: 6,
    needsGarden: false,
    needsBalcony: false,
    needsOffStreet: false,
    nearGreen: false
  });
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (name === "budget") {
      const cleaned = value.replace(/[^0-9]/g, "");
      setForm(f => ({ ...f, budget: cleaned }));
    } else {
      setForm(f => ({
        ...f,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const formatPrice = val => {
    if (!val) return "";
    return "£" + Number(val).toLocaleString();
  };

  const findMatches = async () => {
    setError(null);
    setLoading(true);
    try {
      const loc = encodeURIComponent(form.location);
      const price_max = form.budget;
      const listing_type = "buy";
      const keywords = [];
      if (form.needsGarden) keywords.push(KEYWORDS.garden);
      if (form.needsBalcony) keywords.push(KEYWORDS.balcony);
      if (form.needsOffStreet) keywords.push(KEYWORDS.offStreet);
      if (form.nearGreen) keywords.push(KEYWORDS.greenSpaces);
      const kwParam =
        keywords.length > 0 ? `&keywords=${keywords.join(",")}` : "";

      const url = `https://api.nestoria.co.uk/api?country=uk&pretty=1&action=search_listings&listing_type=${listing_type}&place_name=${loc}&page=1&price_max=${price_max}${kwParam}`;
      const res = await fetch(url);
      const json = await res.json();
      const listings = json.response?.listings || [];

      const enriched = listings
        .filter(p =>
          form.bedrooms ? p.bedroom_number >= form.bedrooms : true
        )
        .map(p => {
          const price = Number(p.price);
          const principal = price * (1 - form.depositPercent / 100);
          const monthlyPayment = calculateMortgage(
            principal,
            form.interestRate,
            25
          );
          const requiredSalary = (monthlyPayment * 12) / 4.5;
          return {
            id: p.lister_url,
            title: p.title,
            price,
            summary: p.summary,
            img: p.img_url,
            monthlyPayment,
            requiredSalary,
            srcUrl: p.lister_url
          };
        });

      setMatches(enriched);
      setStep(4);
    } catch (e) {
      setError("Error fetching listings. Try again?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="title">🏡 HomeMatch Finder</h1>

      {step === 1 && (
        <div>
          <h2>Step 1: Budget & Preferences</h2>
          <label>Budget (£):</label>
          <input
            name="budget"
            type="text"
            placeholder="£500,000"
            value={formatPrice(form.budget)}
            onChange={handleChange}
            className="input"
          />
          <label>Bedrooms:</label>
          <select name="bedrooms" value={form.bedrooms} onChange={handleChange} className="input">
            <option value="">Any</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
          </select>

          <label>Deposit: {form.depositPercent}%</label>
          <input
            type="range"
            name="depositPercent"
            min="5"
            max="50"
            value={form.depositPercent}
            onChange={handleChange}
          />

          <label>Interest Rate:</label>
          <select name="interestRate" value={form.interestRate} onChange={handleChange} className="input">
            {AVAILABLE_RATES.map(r => (
              <option key={r} value={r}>{r}%</option>
            ))}
          </select>

          <div style={{ marginTop: 10 }}>
            <label><input type="checkbox" name="needsGarden" checked={form.needsGarden} onChange={handleChange} /> Garden</label>
            <label style={{ marginLeft: 10 }}><input type="checkbox" name="needsBalcony" checked={form.needsBalcony} onChange={handleChange} /> Balcony</label>
            <label style={{ marginLeft: 10 }}><input type="checkbox" name="needsOffStreet" checked={form.needsOffStreet} onChange={handleChange} /> Off-street parking</label>
            <label style={{ marginLeft: 10 }}><input type="checkbox" name="nearGreen" checked={form.nearGreen} onChange={handleChange} /> Green spaces</label>
          </div>

          <button onClick={nextStep} disabled={!form.budget} className="button" style={{ marginTop: 20 }}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Step 2: Location</h2>
          <input
            name="location"
            type="text"
            placeholder="e.g. London, Bristol, Leeds"
            value={form.location}
            onChange={handleChange}
            className="input"
          />
          <button onClick={prevStep} className="button" style={{ marginRight: 10 }}>Back</button>
          <button onClick={findMatches} className="button">Search Properties</button>
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>
      )}

      {step === 4 && (
        <div>
          <h2>Properties Found</h2>
          {!matches?.length && <p>No results. Try adjusting filters.</p>}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {matches.map(p => (
              <li key={p.id} className="property-card">
                <a href={p.srcUrl} target="_blank" rel="noopener noreferrer"><strong>{p.title}</strong></a> – {formatPrice(p.price)}<br />
                {p.img && <img src={p.img} alt="" width="150" style={{ marginTop: 10, borderRadius: 8 }} />}
                <p>{p.summary}</p>
                <p><strong>Monthly Mortgage:</strong> £{p.monthlyPayment.toFixed(0)}</p>
                <p><strong>Required Salary:</strong> £{p.requiredSalary.toFixed(0)}</p>
              </li>
            ))}
          </ul>
          <button onClick={() => setStep(1)} className="button">Start Again</button>
        </div>
      )}
    </div>
  );
}
