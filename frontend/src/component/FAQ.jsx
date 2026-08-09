import React, { useState } from "react";
import "./FAQ.css";

const faqData = [
  {
    question: "Do you provide home delivery?",
    answer: "Yes, we provide home delivery within 2-3 working days."
  },
  {
    question: "Do you offer bulk discounts?",
    answer: "Yes, special discounts are available for bulk purchases."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept UPI, Debit Card, Credit Card and Cash on Delivery."
  },
  {
    question: "Do you provide cartridge refilling service?",
    answer: "Yes, we provide fast and reliable cartridge refilling service."
  }
];

const Faq = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faq-section">
      <h2 className="faq-title">Frequently Asked Questions</h2>

      {faqData.map((item, index) => (
        <div key={index} className="faq-item">
          <div
  className="faq-question"
  onClick={() => toggleFAQ(index)}
>
  {item.question}
  <span>
    {activeIndex === index ? "−" : "+"}
  </span>
</div>


          {activeIndex === index && (
            <div className="faq-answer">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default Faq;
