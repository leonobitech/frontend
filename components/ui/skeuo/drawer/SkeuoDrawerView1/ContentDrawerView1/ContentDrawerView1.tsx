import "./ContentDrawerView1.css";
import content from "./content.json";

export function ContentDrawerView1() {
  return (
    <div className="drawer-content-view">
      {content.sections.map((item, idx) => (
        <div key={idx} className="drawer-section mt-5">
          <i className={`drawer-icon ${item.icon}`} />
          <div className="drawer-texts">
            <h3 className="drawer-title">{item.title}</h3>
            <p className="drawer-description">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
