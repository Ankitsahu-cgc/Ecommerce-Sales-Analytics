# E-Commerce Sales Analytics Dashboard

## Overview

This project is an end-to-end e-commerce sales analytics project based on order data from January to June 2025.

The project covers data cleaning, transformation, analysis and visualization. Excel, Python/Pandas, DAX and Power BI were used during the data preparation and analysis process. An interactive web dashboard was then developed using HTML, CSS, JavaScript and Plotly.js.

## Objectives

The main objective of this project is to analyze:

- Sales and net amount
- Profit and profitability
- Order performance
- Category and product performance
- Order status and return rate
- Payment mode distribution
- State and city-wise sales
- Discount and its relationship with profit
- Monthly sales trends

## Tools and Technologies

### Data Preparation and Analysis

- Microsoft Excel
- Python
- Pandas
- NumpPy
- Power BI
- DAX

### Dashboard Development

- HTML
- CSS
- JavaScript
- Plotly.js

## Data Preparation

The dataset was first inspected and cleaned before analysis.

The data preparation process included:

- Handling missing values
- Checking duplicate records
- Cleaning categorical fields
- Converting and validating date fields
- Preparing numerical columns
- Creating analysis-ready data

Pandas was used for data cleaning and transformation, while Excel was used for initial data inspection and validation.

## Power BI Analysis

Power BI was used to analyze the cleaned dataset and create business metrics using DAX.

The main metrics include:

- Total Sales
- Total Net Amount
- Total Profit
- Total Orders
- Average Discount
- Return Rate

Example DAX measures:

```DAX
Total Sales = SUM(Ecommerce[Sales])

Total Profit = SUM(Ecommerce[Profit])

Total Orders = DISTINCTCOUNT(Ecommerce[Order_ID])

Average Discount % = AVERAGE(Ecommerce[Discount])

Return Rate % =
DIVIDE(
    [Returned Orders],
    [Total Orders],
    0
)
