import React from 'react';
import Modal from 'react-modal';

interface ModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    contentLabel: string;
    errorMessage: string;
    isError: boolean;
}

const CustomModal: React.FC<ModalProps> = ({
    isOpen,
    onRequestClose,
    contentLabel,
    errorMessage,
    isError,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel={contentLabel}
            className={`bg-white p-4 rounded-md absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isError ? '' : 'bg-green-100'
                }`}
            overlayClassName="fixed inset-0 bg-black bg-opacity-75"
        >
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{errorMessage}</p>
            <button
                onClick={onRequestClose}
                className={`mt-4 px-4 py-2 ${isError ? 'bg-red-500' : 'bg-green-500'
                    } text-white rounded-md hover:${isError ? 'bg-red-600' : 'bg-green-600'
                    }`}
            >
                Close
            </button>
        </Modal>
    );
};

export default CustomModal;
