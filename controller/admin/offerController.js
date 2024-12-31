const Offer = require('../../Models/offerSchema');

const loadAddOffer = async (req, res) => {
  try {
      res.render('addOffer'); 
  } catch (error) {
      console.error('Error while rendering Add Offer page:', error);
      res.status(500)
  }
};

const addOffer = async (req, res) => {
  const { title, description,discount } = req.body;

  if (!title || !discount || discount <= 0) {
    return res.status(400).json({ error: 'All fields are required, and discount must be valid.' });
  }

  try {
    const newOffer = new Offer({ title, description,discount});
    await newOffer.save();
    res.status(201).json({success:true,message: 'Offer added successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};


const getOffers = async (req, res) => {
  const { page = 1, search = '' } = req.query;
  const ITEMS_PER_PAGE = 10;

  try {
    const searchQuery = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const totalOffers = await Offer.countDocuments(searchQuery);

    const offers = await Offer.find(searchQuery)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE);

    res.render('offerManagement', {
      offers,
      totalOffers,
      totalPages: Math.ceil(totalOffers / ITEMS_PER_PAGE),
      currentPage: Number(page),
      search,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const loadEditOffer = async (req, res) => {
  const {id} = req.params;
  try {
    const offer = await Offer.findById(id)
    if(!offer){
      res.status(500).json({success:false,message:"No offer found"})
    }
    res.render("updateOffer",{offer})
    } catch (error) {
    
  }
}

const editOffer = async (req, res) => {
  const { id } = req.params;
  const {title,description,discount} = req.body


  if (!title || !discount || discount <= 0) {
    return res.status(400).json({ error: 'All fields are required, and discount must be valid.' });
  }

  try {
    const updatedOffer = await Offer.findByIdAndUpdate(
      id,
      { title, description,discount},
      { new: true }
    );

    if (!updatedOffer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    res.status(200).json({ message: 'Offer updated successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};


const deleteOffer = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedOffer = await Offer.findByIdAndDelete(id);

    if (!deletedOffer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    res.status(200).json({success:true});
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};


const toggleOffer = async (req, res) => {
  const { id } = req.params;

  try {
    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }
    if(offer.isActive==true){
      offer.isActive = false
    }else{
      offer.isActive = true
    }

    await offer.save();

    res.status(200).json({success:true})
  } catch (error) {
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  loadAddOffer,
  addOffer,
  getOffers,
  loadEditOffer,
  editOffer,
  deleteOffer,
  toggleOffer,
};