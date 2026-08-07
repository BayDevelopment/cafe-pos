import Swal from 'sweetalert2'

// Toast simpel pojok kanan atas, dipakai untuk semua notifikasi sukses
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer
        toast.onmouseleave = Swal.resumeTimer
    }
})

export const useProductManager = () => {
    const form = ref({ 
        id: null, 
        categoryId: 0, 
        name: '', 
        sku: '', 
        price: 0, 
        costPrice: 0, 
        stock: 0, 
        isActive: true 
    })
    
    const isFormOpen = ref<boolean>(false)
    const isSaving = ref<boolean>(false)
    const editingProduct = ref<any>(null)
    const formError = ref<string | null>(null)
    
    // State khusus file gambar
    const imageFile = ref<File | null>(null)
    const imagePreview = ref<string | null>(null)

    const handleFileChange = (e: Event) => {
        const target = e.target as HTMLInputElement
        if (target.files && target.files[0]) {
            const file = target.files[0]
            imageFile.value = file
            imagePreview.value = URL.createObjectURL(file)
        }
    }

    const deleteProduct = async (product: any, refreshCallback?: () => void) => {
        try {
            await $fetch(`/api/products/${product.id}`, { method: 'DELETE' })
            
            Toast.fire({
                icon: 'success',
                title: 'Produk berhasil dihapus'
            })
            
            if (refreshCallback) refreshCallback()
        } catch (err: any) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: err?.data?.message || 'Gagal menghapus produk.',
                confirmButtonColor: '#9b3a2e'
            })
        }
    }

    const saveProduct = async (refreshCallback?: () => void) => {
        isSaving.value = true
        formError.value = null // Reset error sebelum mencoba
        try {
            // Gunakan FormData untuk mendukung file upload
            const formData = new FormData()
            formData.append('name', form.value.name)
            formData.append('sku', form.value.sku || '')
            formData.append('price', String(form.value.price))
            formData.append('costPrice', String(form.value.costPrice || 0))
            formData.append('stock', String(form.value.stock))
            formData.append('categoryId', String(form.value.categoryId))
            formData.append('isActive', String(form.value.isActive))

            if (imageFile.value) {
                formData.append('image', imageFile.value)
            }

            const method = editingProduct.value ? 'PUT' : 'POST'
            const url = editingProduct.value ? `/api/products/${form.value.id}` : '/api/products'
            
            await $fetch(url, {
                method: method,
                body: formData
            })

            Toast.fire({
                icon: 'success',
                title: 'Data produk tersimpan'
            })
            
            closeForm()
            if (refreshCallback) refreshCallback()
        } catch (err: any) {
            // Masukkan pesan error ke formError agar tampil sebagai teks danger di dalam modal
            formError.value = err?.data?.message || 'Terjadi kesalahan saat menyimpan.'
        } finally {
            isSaving.value = false
        }
    }

    const openForm = (product: any = null, categories: any[] = []) => {
        editingProduct.value = product
        form.value = product ? { ...product } : { id: null, categoryId: 0, name: '', sku: '', price: 0, costPrice: 0, stock: 0, isActive: true }
        imageFile.value = null
        imagePreview.value = product?.image || null
        formError.value = null // Reset error saat membuka form
        isFormOpen.value = true
    }

    const closeForm = () => {
        isFormOpen.value = false
        imageFile.value = null
        imagePreview.value = null
        formError.value = null
    }

    return {
        form,
        isFormOpen,
        isSaving,
        editingProduct,
        formError,
        imagePreview,
        handleFileChange,
        saveProduct,
        deleteProduct,
        openForm,
        closeForm
    }
}