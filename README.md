This node.js application scans the metadata information of png type images produced in a style similar to **Stable Diffusion promt** in a folder according to the parameters entered from the interface, and when the match entered in the interface is achieved, it moves the images to the matched folders. It provides a more flexible categorization opportunity by placing label information in png files if desired.

Many search rules can be defined in the interface at once, and all files can be moved to different folders and classified with a single click.

Using image management applications that support tags, browsing through images via the tag system also provides great time savings and ease of access.

![image](https://github.com/osmane/pngcat/assets/2101656/08c382bf-a8ad-4a8b-bd3d-ba5f68eb3bc7)



## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (LTS version recommended)
- npm (comes with Node.js)

## Installation

To install the application, follow these steps:

1. Clone the repository to your local machine:
git clone https://github.com/osmane/pngcat.git

2. Navigate to the application's directory in command promt:
for example: cd pngcat

3. Install the required npm packages:
npm install

## Running the Application

Once the installation is complete, you can run the application with:

npm start

(or Run the start.bat file)

This will start the server locally on the default port specified in the application. (http://localhost:3000/)

Open the browser and enter localhost:3000

## Using

There are necessary explanations in the tool tips of the controls in the application interface.

After tagging, you can install the [**digiKam**](https://www.digikam.org/) application to use the filtering features according to tags.

## Notes: 
The application is in **beta** phase

The application only searches for the expressions you have entered into the interface on the text within the positive prompt of the PNG and performs folders and tags. it does not try to detect what is on the image using an artificial intelligence tool.
