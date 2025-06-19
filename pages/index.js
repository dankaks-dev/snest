import { useState } from "react";

const MOCK_PROPERTIES = [
  {
    id: 1,
    title: "Cozy 2-bed flat in Manchester",
    location: "Manchester",
    price: 150000,
    bedrooms: 2,
    garden: false,
    parking: true,
    description: "Great for first-time buyers, close to city centre",
  },
  {
    id: 2,
    title: "Spacious 3-bed house in Leeds",
    location: "Leeds",
    price: 200000,
    bedrooms: 3,
    garden: true,
    parking: true,
    description: "Family home near schools and parks",
  },
  {
    id: 3,
    title: "Modern 1-bed flat in Bristol",
    location: "Bristol",
    price: 130000,
    bedrooms: 1,
    garden: false,
    parking: false,
    description: "Perfect starter home close to transport links",
  },
];

// Mortgage calculator function
function calculateMortgage(principal, annualRate = 0.06, years = 25) {
  const monthlyRate = annualRate / 12;
  const n = years * 12;
  return (
    (principal * monthlyRate) /
    (1 - Math.pow(1 + monthlyRate, -n))
  );
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    budget: "",
    location: "",
    bedrooms: "",
    needsGarden: false,
    needsParking: false,
    depositPercent: 10,
    interestRate: 6,
  });
  const [matches, setMatches] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const findMatches = () => {
    const budget = Number(form.budget);
    const bedrooms = Number(form.bedrooms);
    const depositPercent = Number(form.depositPercent);
    const interestRate = Number(form.interestRate) / 100;

    const filtered = MOCK_PROPERTIES.filter((p) => {
      if (p.price > budget) return false;
      if (bedrooms && p.bedrooms < bedrooms) return false;
      if (form.needsGarden && !p.garden) return false;
      if (form.needsParking && !p.parking) return false;
      if (form.location && !p.location.toLowerCase().includes(form.location.toLowerCase()))
        return false;
      return true;
    });

    const enriched = filtered.map((p) => {
      const principal = p.price * (1 - depositPercent / 100);
      const monthlyPayment = calculateMortgage(principal, interestRate);
      const requiredSalary = (monthlyPayment * 12) / 4.5;
      return {
        ...p,
        monthlyPayment,
        requiredSalary,
      };
    });

    setMatches(enriched);
    setStep(4);
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.5,
      }}
    >
      <h1>🏡 Find Your Perfect First Home</h1>

      {step === 1 && (
        <>
          <h2>What's your budget?</h2>
          <input
            type="number"
            name="budget"
            value={form.budget}
            onChange={handleChange}
            placeholder="Max price (£)"
            style={{ fontSize: 18, padding: 8, width: "100%" }}
          />

          <label style={{ marginTop: 20, display: "block" }}>
            Deposit (%): {form.depositPercent}%
            <input
              type="range"
              name="depositPercent"
              min="5"
              max="50"
              value={form.depositPercent}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </label>

          <label style={{ marginTop: 20, display: "block" }}>
            Interest Rate:
            <select
              name="interestRate"
              value={form.interestRate}
              onChange={handleChange}
              style={{ marginLeft: 10, fontSize: 16 }}
              title="Annual interest rate used to estimate mortgage payments"
            >
              <option value="3">3%</option>
              <option value="4">4%</option>
              <option value="5">5%</option>
              <option value="6">6%</option>
            </select>
            <span
              style={{
                marginLeft: 8,
                cursor: "help",
                borderBottom: "1px dotted black",
              }}
              title="The annual interest rate affects your monthly mortgage payment. Lower rates mean lower payments."
            >
              ?
            </span>
          </label>

          <button
            onClick={nextStep}
            disabled={!form.budget}
            style={{ marginTop: 20 }}
          >
            Next
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2>Where would you like to live?</h2>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            placeholder="City or area"
            style={{ fontSize: 18, padding: 8, width: "100%" }}
          />
          <button onClick={prevStep} style={{ marginRight: 10, marginTop: 20 }}>
            Back
          </button>
          <button onClick={nextStep} style={{ marginTop: 20 }}>
            Next
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <h2>What do you need?</h2>
          <label style={{ display: "block", marginTop: 10 }}>
            Bedrooms:
            <select
              name="bedrooms"
              value={form.bedrooms}
              onChange={handleChange}
              style={{ marginLeft: 10, fontSize: 16 }}
            >
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
            </select>
          </label>

          <label style={{ display: "block", marginTop: 10 }}>
            <input
              type="checkbox"
              name="needsGarden"
              checked={form.needsGarden}
              onChange={handleChange}
            />{" "}
            Needs garden
          </label>

          <label style={{ display: "block", marginTop: 10 }}>
            <input
              type="checkbox"
              name="needsParking"
              checked={form.needsParking}
              onChange={handleChange}
            />{" "}
            Needs parking
          </label>

          <button onClick={prevStep} style={{ marginRight: 10, marginTop: 20 }}>
            Back
          </button>
          <button onClick={findMatches} style={{ marginTop: 20 }}>
            Find Matches
          </button>
        </>
      )}

      {step === 4 && (
        <>
          <h2>Matches For You</h2>
          {matches && matches.length ? (
            <ul>
              {matches.map((p) => (
                <li key={p.id} style={{ marginBottom: 25 }}>
                  <strong>{p.title}</strong> - £{p.price.toLocaleString()} <br />
                  Location: {p.location} <br />
                  Bedrooms: {p.bedrooms} <br />
                  {p.garden && "Garden available"}{" "}
                  {p.parking && "• Parking available"} <br />
                  <em>{p.description}</em> <br />
                  <strong>Estimated mortgage:</strong>{" "}
                  £{p.monthlyPayment.toFixed(0)} / month{" "}
                  <span
                    title="Assuming your selected deposit and interest rate over 25 years"
                    style={{
                      borderBottom: "1px dotted black",
                      cursor: "help",
                      marginLeft: 5,
                    }}
                  >
                    ?
                  </span>
                  <br />
                  <strong>Estimated minimum salary needed:</strong>{" "}
                  £{p.requiredSalary.toFixed(0)} / year{" "}
                  <span
                    title="Mortgage lenders usually allow you to borrow 4.5 times your annual salary"
                    style={{
                      borderBottom: "1px dotted black",
                      cursor: "help",
                      marginLeft: 5,
                    }}
                  >
                    ?
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No matches found. Try changing your criteria.</p>
          )}
          <button onClick={() => setStep(1)} style={{ marginTop: 20 }}>
            Start Over
          </button>
        </>
      )}
    </div>
  );
}
