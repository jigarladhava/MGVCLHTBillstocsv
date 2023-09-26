const fs = require('fs');
const PDFExtract = require('pdf.js-extract').PDFExtract;
const csvWriter = require('csv-writer');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const pdfExtract = new PDFExtract();
const options = {}; /* see below */
const cliProgress = require('cli-progress');

const allDataArray = [];

const files = fs.readdirSync('pdftoprocess');
const csvFileName = 'results/HTbilldetails.csv';
const csvFileNameout = 'results/HTbilldetails_unique.csv';

const multibar = new cliProgress.MultiBar({
  clearOnComplete: false,
  hideCursor: true,
  format: ' {bar} | {filename} | {value}/{total} | {percentage}% completed | ETA: {eta}s',
}, cliProgress.Presets.shades_grey);

function wrap() {
  return new Promise((resolve) => setTimeout(resolve, 5000));
}



console.log(files.length);
let totalfiles  = files.length - 1;

const bar1 = multibar.create(totalfiles, 0);
Processloop(files);

async function Processloop(files) {
  //files.length
  for (let i = 0; i < files.length; i++) {
    bar1.update(i,{filename : files[i]});
    // if (files[i].endsWith('13011billForm.pdf')||files[i].endsWith('14468billForm.pdf')) {
    if (files[i].endsWith('.pdf')) {
	 
    //  console.log("\n" + 'Processing...' + files[i])
      await startProcess("pdftoprocess/" + files[i]);
      //  await delay(50);
       }
   
  }
  
  await writeCsv(allDataArray);
  // Read the CSV file into memory
  const csvFile = fs.readFileSync(csvFileName, 'utf8');

  // Create a set to store the unique lines
  const uniqueLines = new Set();

  // Iterate over the lines in the CSV file and add them to the set
  csvFile.split('\n').forEach(line => {
    uniqueLines.add(line);
  });

  // Convert the set to an array
  const uniqueLinesArray = Array.from(uniqueLines);

  // Write the array to a new CSV file
  fs.writeFileSync(csvFileNameout, uniqueLinesArray.join('\n'));
  bar1.stop();
  console.log("conversion Completed.");


}

async function startProcess(file) {
  await wrap();

  if (file.endsWith('.pdf')) {
    const extracteddata = {};
    pdfExtract.extract(file, options, async (err, data) => {
      if (err) return console.log(err);


    //  console.log('Processing file : ' + file)
      let dataArray = [];
      for (let i = 0; i < data.pages.length; i++) {
        dataArray = [].concat(dataArray, data.pages[i].content);
        // console.log(data.pages[i].content);
      }
      //  console.log(dataArray);


      for (let i = 0; i < dataArray.length; i++) {

        if (dataArray[i].str.includes("FOR THE MONTH OF")) {
          let Month = dataArray[i].str;
          extracteddata['Month'] = Month.split(":")[1];


        }

        else if (dataArray[i].str.includes("By RPAD")) {

          i++;
          i++;
          let toAddress = dataArray[i].str;


          do {
            i++;
            if (dataArray[i].str.length > 0) {
              toAddress = toAddress + '\n' + dataArray[i].str;
            }

          } while (!dataArray[i + 1].str.includes("OFFICE OF EXEC."))
          extracteddata['toAddress'] = toAddress;

        }

        else if (dataArray[i].str.includes('Bank Guarantee')) {
          let consumerNo = dataArray[i + 2].str;
          let Tarrif = dataArray[i + 4].str;
          let ContractDemand = dataArray[i + 6].str;
          let P85ContractDemand = dataArray[i + 8].str;
          let ActMaxDemand = dataArray[i + 10].str;
          let BillingDemand = dataArray[i + 12].str;
          

          extracteddata['consumerNo'] = consumerNo;
          extracteddata['Tarrif'] = Tarrif;
          extracteddata['ContractDemand'] = ContractDemand;
          extracteddata['P85ContractDemand'] = P85ContractDemand;
          extracteddata['ActMaxDemand'] = ActMaxDemand;
          extracteddata['BillingDemand'] = BillingDemand;


        }
        else if (dataArray[i].str.includes('Supp Voltage')) {
          let SDCASH = dataArray[i - 4].str;
          let KWH = dataArray[i + 18].str;
          let KVAH = dataArray[i + 20].str;
          let KVARH = dataArray[i + 22].str;
          let AvgPF = dataArray[i + 24].str;
          
          extracteddata['SDCASH'] = SDCASH;
          extracteddata['KWH'] = KWH;
          extracteddata['KVAH'] = KVAH;
          extracteddata['KVARH'] = KVARH;
          extracteddata['AvgPF'] = AvgPF;




        }

        else if (dataArray[i].str.includes('Diff*MF')) {
          let DiffMKWH = dataArray[i + 2].str;
          let DiffMKVAH = dataArray[i + 4].str;
          let DiffMKVARH = dataArray[i + 6].str;


          extracteddata['DiffMKWH'] = DiffMKWH;
          extracteddata['DiffMKVAH'] = DiffMKVAH;
          extracteddata['DiffMKVARH'] = DiffMKVARH;





        }

        else if (dataArray[i].str.includes('Energy Charges')) {
          let EnergyChKWH = dataArray[i + 2].str;

          extracteddata['EnergyChKWH'] = EnergyChKWH;


        }
        else if (dataArray[i].str.includes('Night Rebate')) {
          let NightRbKWH = dataArray[i + 2].str;
          if (!isNaN(NightRbKWH)) {
            extracteddata['NightRbKWH'] = NightRbKWH;
          }

        }
        else if (dataArray[i].str.includes('TOU')) {
          let TOU = dataArray[i + 2].str;

          extracteddata['TOU'] = TOU;


        }

        else if (dataArray[i].str.trim() === new String("Tot Consumption").trim()) {
          let DemandChargeRs = dataArray[i + 4].str;
          let EnergyChargeRs = dataArray[i + 6].str;
          let FuelSurchargeRs = dataArray[i + 8].str;
          let PFAdjRebateRs = dataArray[i + 10].str;
          let NightrebateRs = dataArray[i + 12].str;
          let TOUchargesRs = dataArray[i + 16].str;

          extracteddata['DemandChargeRs'] = DemandChargeRs;
          extracteddata['EnergyChargeRs'] = EnergyChargeRs;
          extracteddata['FuelSurchargeRs'] = FuelSurchargeRs;
          extracteddata['PFAdjRebateRs'] = PFAdjRebateRs;
          extracteddata['NightrebateRs'] = NightrebateRs;
          extracteddata['TOUchargesRs'] = TOUchargesRs;
        }

        else if (dataArray[i].str.trim() === new String("Tot Consumption Charge").trim()) {
       //   console.log('Old Scheme');
          let DemandChargeRs = dataArray[i + 2].str;
          let EnergyChargeRs = dataArray[i + 4].str;
          let FuelSurchargeRs = dataArray[i + 6].str;
          let PFAdjRebateRs = dataArray[i + 8].str;
          let NightrebateRs = dataArray[i + 10].str;
          let TOUchargesRs = dataArray[i + 14].str;

          extracteddata['DemandChargeRs'] = DemandChargeRs;
          extracteddata['EnergyChargeRs'] = EnergyChargeRs;
          extracteddata['FuelSurchargeRs'] = FuelSurchargeRs;
          extracteddata['PFAdjRebateRs'] = PFAdjRebateRs;
          extracteddata['NightrebateRs'] = NightrebateRs;
          extracteddata['TOUchargesRs'] = TOUchargesRs;
        }


        else if (dataArray[i].str.includes('Outstanding Arrears')) {
          let ElecDuty = dataArray[i + 2].str;
          extracteddata['ElecDuty'] = ElecDuty;

        }





        else if (dataArray[i].str.includes('nth\'s Bill')) {
          let CurrentMonthBillRs = dataArray[i + 8].str;
          extracteddata['CurrentMonthBillRs'] = CurrentMonthBillRs;

        }



        else if (dataArray[i].str.trim() === new String("Freeze Amount").trim()) {
          let DelatedPaymentChRs = dataArray[i + 2].str;
          extracteddata['DelayedPaymentChRs'] = DelatedPaymentChRs;
        }

        else if (dataArray[i].str.trim() === new String('Freeze').trim()) {

          let DelatedPaymentChRs = dataArray[i + 4].str;
          extracteddata['DelayedPaymentChRs'] = DelatedPaymentChRs;

        }
        else if (dataArray[i].str.includes('system generated bill')) {
        break;
        }




      }
     // console.log(extracteddata);

      allDataArray.push(extracteddata);

      /*
    fs.writeFile('20230913011billForm2.txt', JSON.stringify(extracteddata), err => {
      if (err) {
        console.error(err);
      }
      // file written successfully
    });*/

    });


  }
};




async function writeCsv(jsonData, header = null) {
  const fileExists = fs.existsSync(csvFileName);
  // Create a CSV writer object

  const writer = csvWriter.createObjectCsvWriter({
    path: csvFileName,
    header: [{
      "id": "Month",
      "title": "Month"
    }, {
      "id": "consumerNo",
      "title": "consumerNo"
    }, {
      "id": "toAddress",
      "title": "toAddress"
    }, {
      "id": "Tarrif",
      "title": "Tarrif"
    }, {
      "id": "ContractDemand",
      "title": "ContractDemand"
    }, {
      "id": "P85ContractDemand",
      "title": "P85ContractDemand"
    }, {
      "id": "ActMaxDemand",
      "title": "ActMaxDemand"
    }, {
      "id": "BillingDemand",
      "title": "BillingDemand"
    }, {
      "id": "SDCASH",
      "title": "SDCASH"
    }, {
      "id": "KWH",
      "title": "KWH"
    }, {
      "id": "KVAH",
      "title": "KVAH"
    }, {
      "id": "KVARH",
      "title": "KVARH"
    }, {
      "id": "AvgPF",
      "title": "AvgPF"
    }, {
      "id": "DiffMKWH",
      "title": "DiffMKWH"
    }, {
      "id": "DiffMKVAH",
      "title": "DiffMKVAH"
    }, {
      "id": "DiffMKVARH",
      "title": "DiffMKVARH"
    }, {
      "id": "TOU",
      "title": "TOU"
    }, 
    
    
    {
      "id": "EnergyChKWH",
      "title": "EnergyChKWH"
    }, {
      "id": "NightRbKWH",
      "title": "NightRbKWH"
    },
    
    
    {
      "id": "DemandChargeRs",
      "title": "DemandChargeRs"
    }, {
      "id": "EnergyChargeRs",
      "title": "EnergyChargeRs"
    }, {
      "id": "FuelSurchargeRs",
      "title": "FuelSurchargeRs"
    },
    {
      "id": "PFAdjRebateRs",
      "title": "PFAdjRebateRs"
    },
    {
      "id": "NightrebateRs",
      "title": "NightrebateRs"
    }, {
      "id": "TOUchargesRs",
      "title": "TOUchargesRs"
    },
    {
      "id": "ElecDuty",
      "title": "ElecDuty"
    },
     {
      "id": "CurrentMonthBillRs",
      "title": "CurrentMonthBillRs"
    }, {
      "id": "DelayedPaymentChRs",
      "title": "DelayedPaymentChRs"
    }],
  });
  /*
    // Write the header if it doesn't exist
    if (!fileExists || header === null) {
      const headers = Object.keys(jsonData);
      writer.writeHeader(headers);
    }
    // Write the header if it doesn't exist
    if (header === null) {
      const headers = Object.keys(jsonData);
      writer.writeHeader(headers);
    }
   */
  // Write the data to the CSV file

  await writer.writeRecords(jsonData);



}


