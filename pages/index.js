import { useState } from "react";

// Mortgage calculator
function calculateMortgage(principal, annualRate = 0.06, years = 25) {
  const monthlyRate = annualRate / 12;
  const n = years * 12;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
}

const AVAILABLE_RATES = [3, 4, 5, 6];
const KEYWORDS = {
  garden: "garden",
  balcony: "balcony",
  offStreet: "off_street_parking",
  greenSpaces: "green" // approximate parameter
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
    setForm(f => ({
      ...f,
      [name]:
        type === "checkbox"
          ? checked
          : name === "bedrooms" || name === "budget"
          ? Number(value)
          : value
    }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const findMatches = async () => {
    setError(null);
    setLoading(true);
    try {
      const loc = encodeURIComponent(form.location);
      const price_max = form.budget;
      const listing_type = "buy";
      // Build keywords list
      const keywords = [];
      if (form.needsGarden) keywords.push(KEYWORDS.garden);
      if (form.needsBalcony) keywords.push(KEYWORDS.balcony);
      if (form.needsOffStreet) keywords.push(KEYWORDS.offStreet);
      if (form.nearGreen) keywords.push(KEYWORDS.greenSpaces);
      const kwParam =
        keywords.length > 0
          ? `&keywords=${keywords.join(",")}`
          : "";

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
          const principal =
            price * (1 - form.depositPercent / 100);
          const monthlyPayment = calculateMortgage(
            principal,
            form.interestRate / 100
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
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "Arial" }}>
      <h1>🏡 Find Your First Home</h1>

      {step === 1 && (
        <>
          <h2>Budget & Preferences</h2>
          <input
            name="budget"
            type="number"
            placeholder="Max price (£)"
            value={form.budget}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
          <label>
            Bedrooms above:
            <select
              name="bedrooms"
              value={form.bedrooms}
              onChange={handleChange}
              style={{ marginLeft: 10 }}
            >
              <option value="">Any</option>
              <option value={1}>1+</option>
              <option value={2}>2+</option>
              <option value={3}>3+</option>
            </select>
          </label>

          <label style={{ display: "block" }}>
            Deposit: {form.depositPercent}%
            <input
              name="depositPercent"
              type="range"
              min="5"
              max="50"
              value={form.depositPercent}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </label>

          <label>
            Interest Rate:
            <select
              name="interestRate"
              value={form.interestRate}
              onChange={handleChange}
              title="Annual mortgage rate"
              style={{ marginLeft: 10 }}
            >
              {AVAILABLE_RATES.map(r => (
                <option key={r} value={r}>
                  {r}%
                </option>
              ))}
            </select>
            <span title="Lower rates mean lower monthly payments" style={{ cursor: "help", marginLeft: 4 }}>?</span>
          </label>

          <div style={{ marginTop: 10 }}>
            <label>
              <input type="checkbox" name="needsGarden" checked={form.needsGarden} onChange={handleChange} /> Garden
            </label>
            <label style={{ marginLeft: 10 }}>
              <input type="checkbox" name="needsBalcony" checked={form.needsBalcony} onChange={handleChange} /> Balcony
            </label>
            <label style={{ marginLeft: 10 }}>
              <input type="checkbox" name="needsOffStreet" checked={form.needsOffStreet} onChange={handleChange} /> Off-street parking
            </label>
            <label style={{ marginLeft: 10 }}>
              <input type="checkbox" name="nearGreen" checked={form.nearGreen} onChange={handleChange} /> Near green spaces
            </label>
          </div>

          <button onClick={nextStep} disabled={!form.budget} style={{ marginTop: 20 }}>
            Next
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Location</h2>
          <input
            name="location"
            type="text"
            placeholder="City, postcode or area"
            value={form.location}
            onChange={handleChange}
            style={{ width: "100%", padding: 8 }}
          />
          <button onClick={prevStep}>Back</button>
          <button onClick={findMatches}>Search Properties</button>
          {loading && <p>Loading...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}

      {step === 4 && (
        <>
          <h2>Matches Found</h2>
          {!matches?.length && <p>No properties found. Try new settings.</p>}
          <ul>
            {matches.map((p, i) => (
              <li key={i} style={{ marginBottom: 20 }}>
                <a href={p.srcUrl} target="_blank">
                  <strong>{p.title}</strong>
                </a> – £{p.price.toLocaleString()}<br />
                {p.img && <img src={p.img} alt="" width="100" />}
                <p>{p.summary}</p>
                <p>
                  <strong>Mortgage:</strong> £{p.monthlyPayment.toFixed(0)}/mo &nbsp;
                  <span title="Based on your deposit and interest rate">?</span>
                </p>
                <p>
                  <strong>Salary needed:</strong> £{p.requiredSalary.toFixed(0)}/yr &nbsp;
                  <span title="Assumes lenders give 4.5× your salary mortgage">?</span>
                </p>
              </li>
            ))}
          </ul>
          <button onClick={() => setStep(1)}>Start Over</button>
          <div style={{ marginTop: 20 }}>
            <a href="https://resources.nestimg.com/nestoria/img/pbr_v1.png">
              <img src="https://resources.nestimg.com/nestoria/img/pbr_v1.png" alt="powered by nestoria.co.uk" width="200" />
            </a>
          </div>
        </>
      )}
    </div>
  );
}
