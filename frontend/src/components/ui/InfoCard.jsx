import Card from "./Card";

function InfoCard({ title, children }) {
  return (
    <Card as="article" className="info-card" variant="soft">
      <h3>{title}</h3>
      <div className="info-card-content">{children}</div>
    </Card>
  );
}

export default InfoCard;
