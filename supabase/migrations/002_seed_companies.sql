-- Real companies with major India operations. Domains drive logo lookup (Brandfetch).
-- ats_type / ats_slug are only filled where a public job-board API is used; leave NULL otherwise.
-- Companies without an ATS get a "careers_url" button until you add a feed for them.
insert into public.companies (name, domain, hq_city, industry, careers_url, ats_type, ats_slug, is_verified) values
 -- Bengaluru
 ('Infosys','infosys.com','Bengaluru','IT Services','https://www.infosys.com/careers/',null,null,true),
 ('Wipro','wipro.com','Bengaluru','IT Services','https://careers.wipro.com/',null,null,true),
 ('Flipkart','flipkart.com','Bengaluru','E-commerce','https://www.flipkartcareers.com/',null,null,true),
 ('Swiggy','swiggy.com','Bengaluru','Food Delivery','https://careers.swiggy.com/',null,null,true),
 ('Razorpay','razorpay.com','Bengaluru','Fintech','https://razorpay.com/jobs/','greenhouse','razorpaysoftware',true),
 ('Zerodha','zerodha.com','Bengaluru','Fintech','https://zerodha.com/careers/',null,null,true),
 ('PhonePe','phonepe.com','Bengaluru','Fintech','https://www.phonepe.com/careers/',null,null,true),
 ('Groww','groww.in','Bengaluru','Fintech','https://groww.in/careers',null,null,true),
 ('Meesho','meesho.io','Bengaluru','E-commerce','https://www.meesho.io/jobs',null,null,true),
 ('Postman','postman.com','Bengaluru','Developer Tools','https://www.postman.com/company/careers/','greenhouse','postman',true),
 -- Mumbai
 ('Tata Consultancy Services','tcs.com','Mumbai','IT Services','https://www.tcs.com/careers',null,null,true),
 ('Reliance Industries','ril.com','Mumbai','Conglomerate','https://careers.ril.com/',null,null,true),
 ('Mahindra & Mahindra','mahindra.com','Mumbai','Automotive','https://www.mahindra.com/careers',null,null,true),
 ('Nykaa','nykaa.com','Mumbai','E-commerce','https://www.nykaa.com/careers',null,null,true),
 -- Delhi-NCR
 ('HCLTech','hcltech.com','Noida','IT Services','https://www.hcltech.com/careers',null,null,true),
 ('Paytm','paytm.com','Noida','Fintech','https://paytm.com/careers',null,null,true),
 ('Info Edge','infoedge.in','Noida','Internet','https://www.infoedge.in/',null,null,true),
 ('Zomato','zomato.com','Gurugram','Food Delivery','https://www.zomato.com/careers',null,null,true),
 ('Delhivery','delhivery.com','Gurugram','Logistics','https://www.delhivery.com/careers',null,null,true),
 ('MakeMyTrip','makemytrip.com','Gurugram','Travel','https://careers.makemytrip.com/',null,null,true),
 ('Bharti Airtel','airtel.in','New Delhi','Telecom','https://www.airtel.in/careers/',null,null,true),
 -- Hyderabad
 ('Dr. Reddy''s Laboratories','drreddys.com','Hyderabad','Pharma','https://www.drreddys.com/careers',null,null,true),
 ('Cyient','cyient.com','Hyderabad','Engineering Services','https://www.cyient.com/careers',null,null,true),
 ('Darwinbox','darwinbox.com','Hyderabad','SaaS','https://www.darwinbox.com/careers',null,null,true),
 -- Pune
 ('Tech Mahindra','techmahindra.com','Pune','IT Services','https://careers.techmahindra.com/',null,null,true),
 ('Persistent Systems','persistent.com','Pune','IT Services','https://www.persistent.com/careers/',null,null,true),
 ('Bajaj Finserv','bajajfinserv.in','Pune','Financial Services','https://www.bajajfinserv.in/careers',null,null,true),
 -- Chennai
 ('Zoho','zoho.com','Chennai','SaaS','https://www.zoho.com/careers/',null,null,true),
 ('Freshworks','freshworks.com','Chennai','SaaS','https://www.freshworks.com/company/careers/',null,null,true),
 ('Cognizant','cognizant.com','Chennai','IT Services','https://careers.cognizant.com/india-en/',null,null,true)
on conflict (domain) do nothing;
