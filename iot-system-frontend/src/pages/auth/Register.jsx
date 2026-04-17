import { useState } from "react";

export function Register() {
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    language: "",
  });
  const [errors, setErrors] = useState({
    fullname: "",
    email: "",
    password: "",
    language: "",
  });

  // change
  const handlechange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value,
    });
  };
}
