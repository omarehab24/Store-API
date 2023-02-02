const Product = require("../models/product");

const getAllProductsStatic = async (req, res) => {
  // Function has access to throw, because this function is wrapped by express-async-errors
  // throw new Error("Testing async errors");
  const products = await Product.find({ price: { $gt: 30 } })
    .sort("price")
    .select("name price");
  res.status(200).json({ products: products, nbHits: products.length });
};

const getAllProducts = async (req, res) => {
  const { featured, company, name, sort, fields, numericFilters } = req.query;
  const queryObject = {};

  // If featured is not null, then add it to the queryObject and set its value to true if featured is true, otherwise set it to false
  if (featured) {
    queryObject.featured = featured === "true" ? true : false;
  }

  if (company) {
    queryObject.company = company;
  }

  if (name) {
    // Follow the regex pattern with case insensitivity to match upper and lower cases.
    queryObject.name = { $regex: name, $options: "i" };
  }

  if (numericFilters) {
    const operatorMap = {
      ">": "$gt",
      ">=": "$gte",
      "=": "$eq",
      "<": "$lt",
      "<=": "$lte",
    };
    const regEx = /\b(>|>=|=|<|<=)\b/g;

    let filters = numericFilters.replace(
      regEx,
      (match) => `-${operatorMap[match]}-`
    );
    console.log(filters);

    // e.g. price-$gt-30,rating-$gt-4
    const options = ["price", "rating"];
    filters = filters.split(",").forEach((item) => {
      const [field, operator, value] = item.split("-");

      if (options.includes(field)) {
        queryObject[field] = { [operator]: Number(value) }; // [operator] object destructuring that dynamically, at runtime, determines what property to extract
      }
    });
  }

  console.log(queryObject);
  let result = Product.find(queryObject);

  if (sort) {
    // Query string syntax: sort=key1,key2. So split it at ',' and then join the keys in a new string
    const sortList = sort.split(",").join(" ");
    result = result.sort(sortList);
  } else {
    // Sort as a default value
    result = result.sort("createdAt");
  }

  if (fields) {
    const fieldsList = fields.split(",").join(" ");
    result = result.select(fieldsList);
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // e.g. ?page=3&limit=2. then skip = the fisrt two pages (3-1=2) and multiply them by the limit to display (3-1=2) * 2 = 4. therefore skip the 4 first elements, in order to display the required elements.
  result = result.skip(skip).limit(limit);

  const products = await result;

  res.status(200).json({ products, nbHits: products.length });
};

module.exports = {
  getAllProducts,
  getAllProductsStatic,
};
