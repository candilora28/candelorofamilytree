# 🌳 Candeloro Family Tree

A comprehensive, interactive family tree application for the Candeloro family, built with React and modern web technologies. This project allows family members to explore their genealogy, discover relationships, and view historical family photos and documents.

## ✨ Features

### 🏠 **Interactive Family Tree**
- **Dynamic Tree Visualization**: Built with D3.js and d3-dtree for smooth, interactive family tree navigation
- **Zoom & Pan**: Click and drag to navigate, scroll to zoom in/out
- **Person Navigation**: Click on any person to view their detailed profile

### 🔍 **Advanced Search & Discovery**
- **Smart Search**: Search by name with automatic suggestions
- **Relationship Detector**: Find how any two family members are related
- **Photo Support**: View profile photos and historical family images
- **Date Integration**: Birth and death dates for better person identification

### 📱 **Mobile-Responsive Design**
- **Mobile-First**: Optimized for all device sizes
- **Touch-Friendly**: Works seamlessly on phones and tablets
- **Responsive Layout**: Adapts to different screen sizes automatically

### 🎯 **Family Relationship Features**
- **Comprehensive Detection**: Identifies cousins, uncles/aunts, in-laws, and deep ancestral relationships
- **Visual Connections**: Clear relationship mapping with photos
- **Historical Context**: Birth, death, and marriage information

## 🚀 **Live Demo**

Visit the live family tree: **[Candeloro Family Tree](https://candilora28.github.io/candelorofamilytree/)**

## 🛠️ **Technology Stack**

- **Frontend**: React 18 with modern hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Tree Visualization**: D3.js with d3-dtree library
- **Styling**: CSS3 with responsive design and media queries
- **Data Format**: GEDCOM parsing with custom JSON conversion
- **Deployment**: GitHub Pages with automatic updates

## 📁 **Project Structure**

```
family-tree-app/
├── src/
│   ├── components/          # React components
│   │   ├── HomePage.jsx     # Main landing page
│   │   ├── PersonView.jsx   # Individual person profiles
│   │   ├── TreeView.jsx     # Family tree visualization
│   │   ├── RelationshipDetector.jsx  # Family relationship finder
│   │   └── SearchResultsModal.jsx    # Search results display
│   ├── data/                # Family tree data
│   │   └── tree.json        # Processed family data
│   ├── assets/              # Images and static assets
│   └── styles/              # CSS styling files
├── public/                  # Public assets and photos
│   └── photos/              # Family historical photos
└── convertGedcomToJson.cjs  # GEDCOM to JSON converter
```

## 🔧 **Getting Started**

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/candilora28/candelorofamilytree.git
   cd candelorofamilytree
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production
```bash
npm run build
```

## 📊 **Data Management**

### GEDCOM Integration
- **Source Format**: GEDCOM files from genealogy software
- **Conversion**: Custom script to convert GEDCOM to optimized JSON
- **Updates**: Easy to add new family members and photos

### Adding New Family Members
1. Update your GEDCOM file with new information
2. Run the conversion script: `node convertGedcomToJson.cjs`
3. The updated `tree.json` will be automatically generated

## 🌟 **Key Features in Detail**

### **Relationship Detection Algorithm**
- **Cousin Detection**: 1st, 2nd, 3rd, and 4th cousins with "removed" variations
- **Uncle/Aunt Recognition**: Paternal/maternal, great, 2nd great, etc.
- **In-Law Relationships**: Father/mother-in-law, brother/sister-in-law
- **Deep Ancestral**: Up to 7th great-grandparents with paternal/maternal side identification

### **Mobile Optimization**
- **Responsive Grid Layouts**: Adapts from desktop to mobile seamlessly
- **Touch Navigation**: Optimized for mobile tree navigation
- **Performance**: Efficient rendering for all device types

## 🤝 **Contributing**

This is a family project, but contributions are welcome! If you're a family member or have suggestions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📸 **Photo Management**

The application supports various image formats:
- **Profile Photos**: Automatically displayed for each family member
- **Historical Documents**: Birth certificates, marriage records, etc.
- **Family Photos**: Group photos and historical images
- **Placeholder System**: Graceful fallbacks for missing images

## 🔗 **External Links**

- **GitHub Repository**: [candilora28/candelorofamilytree](https://github.com/candilora28/candelorofamilytree)
- **Live Site**: [Candeloro Family Tree](https://candilora28.github.io/candelorofamilytree/)
- **GEDCOM Standard**: [FamilySearch GEDCOM](https://www.gedcom.org/)

## 📞 **Contact**

For questions about the family tree or technical support, please contact the project maintainer through GitHub.

---

**Built with ❤️ for the Candeloro Family**

*Preserving our family history, one generation at a time.*
